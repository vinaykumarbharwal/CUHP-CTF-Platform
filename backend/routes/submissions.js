const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const User = require('../models/User');

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
