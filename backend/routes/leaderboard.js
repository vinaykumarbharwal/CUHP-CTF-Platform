const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const { hasChallengesUnlocked, getSecondsUntilChallengesUnlock } = require('../utils/ctfSchedule');

router.get('/', auth, async (req, res) => {
  try {
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Leaderboard will be visible on 08 May 2026 at 10:00 AM IST',
        releaseAt: '2026-05-08T10:00:00+05:30',
        retryAfterSeconds: getSecondsUntilChallengesUnlock()
      });
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

module.exports = router;
