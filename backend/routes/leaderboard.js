const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const { hasChallengesUnlocked } = require('../utils/ctfSchedule');

router.get('/registered-teams', auth, async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('members', 'username')
      .select('name members createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const registeredTeams = teams.map((team, index) => ({
      rank: index + 1,
      id: team._id,
      name: team.name,
      totalScore: 0,
      members: team.members || [],
      solvedCount: 0,
      createdAt: team.createdAt
    }));

    return res.json(registeredTeams);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      const teams = await Team.find({})
        .populate('members', 'username')
        .select('name')
        .lean();

      const registeredTeams = teams.map((team, index) => ({
        rank: index + 1,
        id: team._id,
        name: team.name,
        totalScore: 0,
        members: team.members || [],
        solvedCount: 0
      }));

      return res.json(registeredTeams);
    }

    const [teams, submissionStats] = await Promise.all([
      Team.find({})
        .populate('members', 'username')
        .select('name'),
      Submission.aggregate([
        {
          $match: {
            isCorrect: true,
            teamId: { $ne: null }
          }
        },
        {
          $group: {
            _id: '$teamId',
            totalScore: { $sum: '$points' },
            solvedCount: { $sum: 1 },
            earliestSubmission: { $min: '$submittedAt' }
          }
        }
      ])
    ]);

    const submissionMap = submissionStats.reduce((acc, stat) => {
      acc[String(stat._id)] = {
        totalScore: stat.totalScore || 0,
        solvedCount: stat.solvedCount || 0,
        earliestSubmission: stat.earliestSubmission
          ? new Date(stat.earliestSubmission).getTime()
          : Infinity
      };
      return acc;
    }, {});

    const rankedTeams = teams
      .map((team) => ({
        ...team.toObject(),
        totalScore: submissionMap[String(team._id)]?.totalScore || 0,
        solvedCount: submissionMap[String(team._id)]?.solvedCount || 0,
        earliestSubmission: submissionMap[String(team._id)]?.earliestSubmission || Infinity
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
        solvedCount: team.solvedCount
      }));

    return res.json(rankedTeams);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/individual/top-scorers', auth, async (req, res) => {
  try {
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      return res.json([]);
    }

    const individualStats = await Submission.aggregate([
      {
        $match: {
          isCorrect: true,
          submittedBy: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$submittedBy',
          totalScore: { $sum: '$points' },
          solvedCount: { $sum: 1 },
          earliestSubmission: { $min: '$submittedAt' }
        }
      },
      {
        $sort: {
          totalScore: -1,
          earliestSubmission: 1
        }
      },
      {
        $limit: 10
      }
    ]);

    const userIds = individualStats.map((stat) => stat._id);
    const User = require('../models/User');
    const users = await User.find({ _id: { $in: userIds } })
      .populate('teamId', 'name')
      .select('username teamId')
      .lean();

    const userMap = users.reduce((acc, user) => {
      acc[String(user._id)] = {
        username: user.username,
        teamName: user.teamId?.name || 'No Team'
      };
      return acc;
    }, {});

    const rankedIndividuals = individualStats
      .map((stat, index) => ({
        rank: index + 1,
        userId: stat._id,
        username: userMap[String(stat._id)]?.username || 'Unknown',
        teamName: userMap[String(stat._id)]?.teamName || 'No Team',
        totalScore: stat.totalScore || 0,
        solvedCount: stat.solvedCount || 0
      }));

    return res.json(rankedIndividuals);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
