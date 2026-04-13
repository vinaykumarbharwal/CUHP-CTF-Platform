const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Team = require('../models/Team');
const Challenge = require('../models/Challenge');

/**
 * @route   GET /api/stats
 * @desc    Get public platform statistics
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const [userCount, teamCount, challengeCount, categories] = await Promise.all([
      User.countDocuments(),
      Team.countDocuments(),
      Challenge.countDocuments(),
      Challenge.distinct('category')
    ]);

    res.json({
      users: userCount,
      teams: teamCount,
      challenges: challengeCount,
      categories: categories
    });
  } catch (error) {
    console.error('Stats aggregation error:', error);
    res.status(500).json({ error: 'Failed to fetch platform statistics' });
  }
});

module.exports = router;
