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
        submittedBy: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$submittedBy',
        points: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', true] }, '$points', 0]
          }
        },
        submissions: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', true] }, 1, 0]
          }
        },
        totalSubmissions: { $sum: 1 },
        incorrectSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', false] }, 1, 0]
          }
        }
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

  const teamTotals = await Submission.aggregate([
    {
      $match: {
        teamId: team._id
      }
    },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        totalScoreFromSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', true] }, '$points', 0]
          }
        },
        successfulSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', true] }, 1, 0]
          }
        },
        failedSubmissions: {
          $sum: {
            $cond: [{ $eq: ['$isCorrect', false] }, 1, 0]
          }
        }
      }
    }
  ]);

  const solvedChallenges = await Submission.aggregate([
    {
      $match: {
        teamId: team._id,
        isCorrect: true,
        challengeId: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$challengeId',
        solvedAt: { $min: '$submittedAt' }
      }
    },
    {
      $lookup: {
        from: 'challenges',
        localField: '_id',
        foreignField: '_id',
        as: 'challenge'
      }
    },
    {
      $unwind: {
        path: '$challenge',
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $project: {
        _id: 0,
        challengeId: {
          _id: '$challenge._id',
          title: '$challenge.title',
          category: '$challenge.category',
          difficulty: '$challenge.difficulty',
          points: '$challenge.points'
        },
        solvedAt: 1
      }
    },
    {
      $sort: { solvedAt: 1 }
    }
  ]);

  const statsMap = stats.reduce((acc, item) => {
    acc[String(item._id)] = {
      points: item.points,
      submissions: item.submissions,
      totalSubmissions: item.totalSubmissions,
      incorrectSubmissions: item.incorrectSubmissions
    };
    return acc;
  }, {});

  const submissionDerivedTotalScore = teamTotals[0]?.totalScoreFromSubmissions || 0;
  team.totalScore = submissionDerivedTotalScore;
  team.solvedChallenges = solvedChallenges;

  team.memberSubmissionStats = (team.members || []).map((member) => {
    const memberId = String(member._id || member);
    const memberStats = statsMap[memberId] || {
      points: 0,
      submissions: 0,
      totalSubmissions: 0,
      incorrectSubmissions: 0
    };
    const totalScore = submissionDerivedTotalScore;
    const contributionPercent = totalScore > 0
      ? Number(((memberStats.points / totalScore) * 100).toFixed(2))
      : 0;

    return {
      userId: memberId,
      username: member.username || 'Member',
      points: memberStats.points,
      submissions: memberStats.submissions,
      totalSubmissions: memberStats.totalSubmissions,
      incorrectSubmissions: memberStats.incorrectSubmissions,
      contributionPercent
    };
  });

  team.unattributedSubmissionStats = {
    points: unattributed[0]?.points || 0,
    submissions: unattributed[0]?.submissions || 0
  };

  const totalAttempts = teamTotals[0]?.totalAttempts || 0;
  const successfulSubmissions = teamTotals[0]?.successfulSubmissions || 0;
  const failedSubmissions = teamTotals[0]?.failedSubmissions || 0;
  const successRatePercent = totalAttempts > 0
    ? Number(((successfulSubmissions / totalAttempts) * 100).toFixed(2))
    : 0;

  team.teamSubmissionStats = {
    totalAttempts,
    successfulSubmissions,
    failedSubmissions,
    successRatePercent
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
