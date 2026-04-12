const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const User = require('../models/User');

router.get('/team/:teamId', auth, async (req, res) => {
  try {
    const { teamId } = req.params;

    const submissions = await Submission.find({ teamId }).sort({ submittedAt: 1 });

    let cumulativeScore = 0;
    const graphData = submissions.map((submission) => {
      cumulativeScore += submission.points;
      return {
        timestamp: submission.submittedAt,
        score: cumulativeScore,
        points: submission.points
      };
    });

    const team = await Team.findById(teamId);
    if (team) {
      graphData.unshift({
        timestamp: team.createdAt,
        score: 0,
        points: 0
      });
    }

    return res.json(graphData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-team', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.teamId) {
      return res.status(404).json({ error: 'You are not in a team' });
    }

    const submissions = await Submission.find({ teamId: user.teamId }).sort({ submittedAt: 1 });

    let cumulativeScore = 0;
    const graphData = submissions.map((submission) => {
      cumulativeScore += submission.points;
      return {
        timestamp: submission.submittedAt,
        score: cumulativeScore,
        points: submission.points
      };
    });

    const team = await Team.findById(user.teamId);
    if (team) {
      graphData.unshift({
        timestamp: team.createdAt,
        score: 0,
        points: 0
      });
    }

    return res.json(graphData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
