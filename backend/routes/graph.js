const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const User = require('../models/User');
const { hasChallengesUnlocked, getSecondsUntilChallengesUnlock } = require('../utils/ctfSchedule');

async function buildTeamGraphData(teamId) {
  const submissions = await Submission.find({ teamId }).sort({ submittedAt: 1 });

  let cumulativeScore = 0;
  const graphData = submissions.map((submission) => {
    cumulativeScore += submission.points;
    return {
      timestamp: submission.submittedAt,
      score: cumulativeScore,
      points: submission.points
    };
  });

  return graphData;
}

router.get('/team/:teamId', auth, async (req, res) => {
  try {
    const { teamId } = req.params;

    const graphData = await buildTeamGraphData(teamId);

    return res.json(graphData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/my-team', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.teamId) {
      return res.status(404).json({ error: 'You are not in a team' });
    }

    const graphData = await buildTeamGraphData(user.teamId);

    return res.json(graphData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get('/all-teams', auth, async (req, res) => {
  try {
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Leaderboard analytics will be visible on 08 May 2026 at 10:00 AM IST',
        releaseAt: '2026-05-08T10:00:00+05:30',
        retryAfterSeconds: getSecondsUntilChallengesUnlock()
      });
    }

    const teams = await Team.find({}, '_id name').lean();

    const scoreTotals = await Submission.aggregate([
      {
        $match: {
          isCorrect: true
        }
      },
      {
        $group: {
          _id: '$teamId',
          totalScore: { $sum: '$points' }
        }
      }
    ]);

    const totalScoreMap = scoreTotals.reduce((acc, item) => {
      acc[String(item._id)] = item.totalScore || 0;
      return acc;
    }, {});

    const initialSeries = teams.map((team) => ({
      teamId: String(team._id),
      teamName: team.name,
      totalScore: totalScoreMap[String(team._id)] || 0,
      points: []
    }));

    const teamSeriesMap = initialSeries.reduce((acc, series) => {
      acc[series.teamId] = series;
      return acc;
    }, {});

    const cumulativeMap = initialSeries.reduce((acc, series) => {
      acc[series.teamId] = 0;
      return acc;
    }, {});

    const submissions = await Submission.find({ isCorrect: true }, 'teamId points submittedAt')
      .sort({ submittedAt: 1 })
      .lean();

    submissions.forEach((submission) => {
      const teamId = String(submission.teamId);
      const targetSeries = teamSeriesMap[teamId];

      if (!targetSeries) {
        return;
      }

      cumulativeMap[teamId] += submission.points;
      targetSeries.points.push({
        timestamp: submission.submittedAt,
        score: cumulativeMap[teamId],
        points: submission.points
      });
    });

    return res.json(initialSeries);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
