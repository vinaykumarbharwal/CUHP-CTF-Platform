const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  totalScore: {
    type: Number,
    default: 0
  },
  solvedChallenges: [
    {
      challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge'
      },
      solvedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

teamSchema.index({ totalScore: -1, 'solvedChallenges.solvedAt': 1 });

module.exports = mongoose.model('Team', teamSchema);
