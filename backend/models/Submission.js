const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  isCorrect: {
    type: Boolean,
    default: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

submissionSchema.index({ teamId: 1, submittedAt: 1 });
submissionSchema.index({ teamId: 1, submittedBy: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
