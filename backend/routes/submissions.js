const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { hasChallengesUnlocked, getSecondsUntilChallengesUnlock } = require('../utils/ctfSchedule');

const INCORRECT_FLAG_LIMIT = 5;
const INCORRECT_FLAG_WINDOW_MS = 10 * 1000;
const COOLDOWN_MESSAGE = 'Too many incorrect flags for this challenge. Take a stop and try a little bit later.';

const submitLimiter = rateLimit({
  windowMs: 10 * 1000,
  max: 10,
  keyGenerator: (req) => {
    const userKey = req.userId || req.ip;
    const challengeKey = req.body?.challengeId || 'unknown-challenge';
    return `${userKey}:${challengeKey}`;
  },
  message: {
    success: false,
    error: 'Too many attempts on this challenge. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});


router.post('/', [auth, submitLimiter], async (req, res) => {
  try {
    const now = Date.now();
    const COMPETITION_END = new Date('2026-05-15T16:00:00+05:30').getTime();
    if (!hasChallengesUnlocked(now) && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Challenge submissions open on 15 May 2026 at 10:00 AM IST',
        releaseAt: '2026-05-15T10:00:00+05:30',
        retryAfterSeconds: getSecondsUntilChallengesUnlock(now)
      });
    }
    if (now > COMPETITION_END && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Challenge submissions closed at 15 May 2026, 4:00 PM IST',
        closedAt: '2026-05-15T16:00:00+05:30'
      });
    }

    const { challengeId, flag } = req.body;

    const user = await User.findById(req.userId);
    if (!user.teamId) {
      return res.status(400).json({ error: 'You must be in a team to submit flags' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const team = await Team.findById(user.teamId);

    const incorrectWindowStart = new Date(Date.now() - INCORRECT_FLAG_WINDOW_MS);
    const incorrectAttempts = await Submission.countDocuments({
      submittedBy: user._id,
      challengeId: challenge._id,
      isCorrect: false,
      submittedAt: { $gte: incorrectWindowStart }
    });

    if (incorrectAttempts >= INCORRECT_FLAG_LIMIT) {
      const oldestAttemptInWindow = await Submission.findOne({
        submittedBy: user._id,
        challengeId: challenge._id,
        isCorrect: false,
        submittedAt: { $gte: incorrectWindowStart }
      })
        .sort({ submittedAt: 1 })
        .select('submittedAt')
        .lean();

      const retryAfterSeconds = oldestAttemptInWindow
        ? Math.max(
            1,
            Math.ceil(
              (INCORRECT_FLAG_WINDOW_MS - (Date.now() - new Date(oldestAttemptInWindow.submittedAt).getTime())) /
                1000
            )
          )
        : Math.ceil(INCORRECT_FLAG_WINDOW_MS / 1000);

      return res.status(429).json({
        success: false,
        error: COOLDOWN_MESSAGE,
        retryAfterSeconds
      });
    }

    const isCorrect = flag === challenge.flag;
    
    // Check if this challenge was already solved (for points calculation)
    const existingCorrectSubmission = await Submission.findOne({
      teamId: team._id,
      challengeId: challenge._id,
      isCorrect: true
    });

    const submission = new Submission({
      teamId: team._id,
      submittedBy: user._id,
      challengeId: challenge._id,
      points: isCorrect ? challenge.points : 0,
      isCorrect
    });
    await submission.save();

    if (!isCorrect) {
      const attemptsAfterThisSubmit = incorrectAttempts + 1;
      if (attemptsAfterThisSubmit >= INCORRECT_FLAG_LIMIT) {
        return res.status(429).json({
          success: false,
          message: COOLDOWN_MESSAGE,
          error: COOLDOWN_MESSAGE,
          retryAfterSeconds: Math.ceil(INCORRECT_FLAG_WINDOW_MS / 1000)
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Incorrect flag',
        error: 'Incorrect flag'
      });
    }

    // Atomic update to prevent race conditions and duplicate points
    // Only add points if this is the first correct solve by this team
    let updatedTeam;
    if (!existingCorrectSubmission) {
      updatedTeam = await Team.findOneAndUpdate(
        { 
          _id: team._id, 
          'solvedChallenges.challengeId': { $ne: challenge._id } 
        },
        {
          $addToSet: { 
            solvedChallenges: { 
              challengeId: challenge._id, 
              solvedAt: new Date() 
            } 
          },
          $inc: { totalScore: challenge.points }
        },
        { new: true }
      );
    } else {
      // Challenge was already solved, just fetch current team state
      updatedTeam = await Team.findById(team._id);
    }

    // If updatedTeam is null, it means it was already solved by someone else in the team 
    // between our check and update. We should still return success but use the current 
    // total score from the database.
    let finalScore;
    if (updatedTeam) {
      finalScore = updatedTeam.totalScore;
    } else {
      const refreshedTeam = await Team.findById(team._id).select('totalScore').lean();
      finalScore = refreshedTeam?.totalScore || team.totalScore;
    }

    return res.json({
      success: true,
      message: 'Correct flag!',
      points: challenge.points,
      totalScore: finalScore
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
