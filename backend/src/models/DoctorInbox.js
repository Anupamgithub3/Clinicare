const mongoose = require('mongoose');

const doctorInboxSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    summaryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiSummary',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'responded', 'archived'],
      default: 'pending',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    doctorNotes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
doctorInboxSchema.index({ doctorId: 1, status: 1 });
doctorInboxSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model('DoctorInbox', doctorInboxSchema);

