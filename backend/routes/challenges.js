const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Challenge = require('../models/Challenge');
const Team = require('../models/Team');
const Submission = require('../models/Submission');
const { hasChallengesUnlocked, getSecondsUntilChallengesUnlock } = require('../utils/ctfSchedule');

router.get('/', auth, async (req, res) => {
  try {
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Challenges will be visible on 08 May 2026 at 10:00 AM IST',
        releaseAt: '2026-05-08T10:00:00+05:30',
        retryAfterSeconds: getSecondsUntilChallengesUnlock()
      });
    }

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
    if (!hasChallengesUnlocked() && req.userRole !== 'admin') {
      return res.status(403).json({
        error: 'Challenges will be visible on 08 May 2026 at 10:00 AM IST',
        releaseAt: '2026-05-08T10:00:00+05:30',
        retryAfterSeconds: getSecondsUntilChallengesUnlock()
      });
    }

    const challenge = await Challenge.findById(req.params.id, '-flag');
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    return res.json(challenge);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', [
  auth,
  admin,
  body('title').isString().trim().isLength({ min: 1 }),
  body('description').isString().trim().isLength({ min: 1 }),
  body('category').isIn(['Web', 'Crypto', 'Binary', 'OSINT', 'Misc', 'Forensic']),
  body('difficulty').isIn(['Easy', 'Medium', 'Hard', 'Expert']),
  body('points').isInt({ min: 1 }),
  body('image').optional().isString(),
  body('flag').isString().trim().isLength({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const challenge = await Challenge.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      difficulty: req.body.difficulty,
      points: req.body.points,
      image: req.body.image || '',
      flag: req.body.flag
    });

    const responseChallenge = challenge.toObject();
    delete responseChallenge.flag;

    return res.status(201).json({ message: 'Challenge created successfully', challenge: responseChallenge });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Challenge flag must be unique' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', [
  auth,
  admin,
  body('title').optional().isString().trim().isLength({ min: 1 }),
  body('description').optional().isString().trim().isLength({ min: 1 }),
  body('category').optional().isIn(['Web', 'Crypto', 'Binary', 'OSINT', 'Misc', 'Forensic']),
  body('difficulty').optional().isIn(['Easy', 'Medium', 'Hard', 'Expert']),
  body('points').optional().isInt({ min: 1 }),
  body('image').optional().isString(),
  body('flag').optional().isString().trim().isLength({ min: 1 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const allowedFields = ['title', 'description', 'category', 'difficulty', 'points', 'image', 'flag'];
    const updates = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid challenge fields provided to update' });
    }

    const updatedChallenge = await Challenge.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true, context: 'query' }
    ).select('-flag');

    if (!updatedChallenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    return res.json({ message: 'Challenge updated successfully', challenge: updatedChallenge });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Challenge flag must be unique' });
    }
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', [auth, admin], async (req, res) => {
  try {
    const challenge = await Challenge.findByIdAndDelete(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    await Promise.all([
      Submission.deleteMany({ challengeId: challenge._id }),
      Team.updateMany(
        {},
        {
          $pull: {
            solvedChallenges: { challengeId: challenge._id }
          }
        }
      )
    ]);

    return res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
