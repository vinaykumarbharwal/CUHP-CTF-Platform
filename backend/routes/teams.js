const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');

router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findById(req.userId);

    if (user.teamId) {
      return res.status(400).json({ error: 'You are already in a team' });
    }

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    const inviteCode = crypto.randomBytes(8).toString('hex');
    const team = new Team({
      name,
      inviteCode,
      members: [user._id]
    });

    await team.save();
    user.teamId = team._id;
    await user.save();

    return res.status(201).json({ team, inviteCode });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const user = await User.findById(req.userId);

    if (user.teamId) {
      return res.status(400).json({ error: 'You are already in a team' });
    }

    const team = await Team.findOne({ inviteCode });
    if (!team) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (team.members.length >= 2) {
      return res.status(400).json({ error: 'Team is already full' });
    }

    team.members.push(user._id);
    await team.save();

    user.teamId = team._id;
    await user.save();

    return res.json({ team, message: 'Successfully joined team' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members', 'username email')
      .populate('solvedChallenges.challengeId');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    return res.json(team);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my/team', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.teamId) {
      return res.status(404).json({ error: 'You are not in a team' });
    }

    const team = await Team.findById(user.teamId)
      .populate('members', 'username email')
      .populate('solvedChallenges.challengeId');

    return res.json(team);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
