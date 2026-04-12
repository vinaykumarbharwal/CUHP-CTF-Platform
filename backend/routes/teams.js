const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const User = require('../models/User');
const Submission = require('../models/Submission');

function hasCtfStarted() {
  const startValue = process.env.CTF_START_TIME;
  if (!startValue) {
    return false;
  }

  const startTime = new Date(startValue);
  if (Number.isNaN(startTime.getTime())) {
    return false;
  }

  return Date.now() >= startTime.getTime();
}

async function attachMemberSubmissionStats(teamDoc) {
  const team = teamDoc?.toObject ? teamDoc.toObject() : teamDoc;
  if (!team) return team;

  const stats = await Submission.aggregate([
    {
      $match: {
        teamId: team._id,
        submittedBy: { $ne: null },
        isCorrect: true
      }
    },
    {
      $group: {
        _id: '$submittedBy',
        points: { $sum: '$points' },
        submissions: { $sum: 1 }
      }
    }
  ]);

  const unattributed = await Submission.aggregate([
    {
      $match: {
        teamId: team._id,
        $or: [
          { submittedBy: null },
          { submittedBy: { $exists: false } }
        ],
        isCorrect: true
      }
    },
    {
      $group: {
        _id: null,
        points: { $sum: '$points' },
        submissions: { $sum: 1 }
      }
    }
  ]);

  const statsMap = stats.reduce((acc, item) => {
    acc[String(item._id)] = {
      points: item.points,
      submissions: item.submissions
    };
    return acc;
  }, {});

  team.memberSubmissionStats = (team.members || []).map((member) => {
    const memberId = String(member._id || member);
    const memberStats = statsMap[memberId] || { points: 0, submissions: 0 };
    const totalScore = team.totalScore || 0;
    const contributionPercent = totalScore > 0
      ? Number(((memberStats.points / totalScore) * 100).toFixed(2))
      : 0;

    return {
      userId: memberId,
      username: member.username || 'Member',
      points: memberStats.points,
      submissions: memberStats.submissions,
      contributionPercent
    };
  });

  team.unattributedSubmissionStats = {
    points: unattributed[0]?.points || 0,
    submissions: unattributed[0]?.submissions || 0
  };

  return team;
}

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

    if (hasCtfStarted()) {
      return res.status(403).json({ error: 'Team joining is closed after CTF starts' });
    }

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

    const teamWithStats = await attachMemberSubmissionStats(team);
    return res.json(teamWithStats);
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

    const teamWithStats = await attachMemberSubmissionStats(team);
    return res.json(teamWithStats);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
