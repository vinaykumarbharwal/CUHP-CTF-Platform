const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');

router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('members', 'username')
      .select('name totalScore solvedChallenges');

    const rankedTeams = teams
      .map((team) => ({
        ...team.toObject(),
        earliestSubmission:
          team.solvedChallenges.length > 0
            ? Math.min(...team.solvedChallenges.map((sc) => sc.solvedAt.getTime()))
            : Infinity
      }))
      .sort((a, b) => {
        if (a.totalScore !== b.totalScore) {
          return b.totalScore - a.totalScore;
        }
        return a.earliestSubmission - b.earliestSubmission;
      })
      .map((team, index) => ({
        rank: index + 1,
        id: team._id,
        name: team.name,
        totalScore: team.totalScore,
        members: team.members,
        solvedCount: team.solvedChallenges.length
      }));

    return res.json(rankedTeams);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
