const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const User = require('../models/User');

const INCORRECT_FLAG_LIMIT = 5;
const INCORRECT_FLAG_WINDOW_MS = 10 * 60 * 1000;
const COOLDOWN_MESSAGE = 'Too many incorrect flags for this challenge. Take a stop and try a little bit later.';

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many submission attempts. Please wait.'
});

router.post('/', [auth, submitLimiter], async (req, res) => {
  try {
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
      teamId: team._id,
      challengeId: challenge._id,
      isCorrect: false,
      submittedAt: { $gte: incorrectWindowStart }
    });

    if (incorrectAttempts >= INCORRECT_FLAG_LIMIT) {
      const oldestAttemptInWindow = await Submission.findOne({
        teamId: team._id,
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

    const alreadySolved = team.solvedChallenges.some(
      (sc) => sc.challengeId.toString() === challengeId
    );

    if (alreadySolved) {
      return res.status(400).json({ error: 'Challenge already solved by your team' });
    }

    const isCorrect = flag === challenge.flag;

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

    team.solvedChallenges.push({
      challengeId: challenge._id,
      solvedAt: new Date()
    });
    team.totalScore += challenge.points;
    await team.save();

    return res.json({
      success: true,
      message: 'Correct flag!',
      points: challenge.points,
      totalScore: team.totalScore
    });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
