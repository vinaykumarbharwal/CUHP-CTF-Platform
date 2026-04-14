const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');

router.get('/', auth, async (req, res) => {
  try {
    const [challenges, teams, solvedPairs] = await Promise.all([
      Challenge.find({}, '-flag').lean(),
      Team.find({}, 'name').lean(),
      Submission.aggregate([
        {
          $match: {
            isCorrect: true,
            teamId: { $ne: null },
            challengeId: { $ne: null }
          }
        },
        {
          $group: {
            _id: {
              challengeId: '$challengeId',
              teamId: '$teamId'
            }
          }
        }
      ])
    ]);

    const teamNameMap = teams.reduce((acc, team) => {
      acc[String(team._id)] = team.name;
      return acc;
    }, {});

    const solvedByMap = solvedPairs.reduce((acc, pair) => {
      const challengeId = String(pair._id.challengeId);
      const teamName = teamNameMap[String(pair._id.teamId)];
      if (!teamName) {
        return acc;
      }
      if (!acc[challengeId]) {
        acc[challengeId] = [];
      }
      acc[challengeId].push(teamName);
      return acc;
    }, {});

    const enrichedChallenges = challenges.map((challenge) => {
      const solvedByTeams = solvedByMap[String(challenge._id)] || [];
      return {
        ...challenge,
        solvedByTeams,
        solvedCount: solvedByTeams.length
      };
    });

    return res.json(enrichedChallenges);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id, '-flag');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    return res.json(challenge);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
