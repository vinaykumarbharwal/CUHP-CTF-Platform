const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Challenge = require('../models/Challenge');

router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find({}, '-flag');
    return res.json(challenges);
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
