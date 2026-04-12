const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');

router.get('/', auth, async (req, res) => {
  try {
    const [challenges, teams] = await Promise.all([
      Challenge.find({}, '-flag').lean(),
      Team.find({}, 'name solvedChallenges.challengeId').lean()
    ]);

    const solvedByMap = teams.reduce((acc, team) => {
      (team.solvedChallenges || []).forEach((solved) => {
        const challengeId = String(solved.challengeId);
        if (!acc[challengeId]) {
          acc[challengeId] = [];
        }
        acc[challengeId].push(team.name);
      });
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
