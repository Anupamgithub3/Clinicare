const mongoose = require('mongoose');

const aiSummarySchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatSession',
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    chiefComplaint: {
      type: String,
      default: '',
    },
    symptoms: [
      {
        symptom: String,
        severity: {
          type: String,
          enum: ['mild', 'moderate', 'severe'],
        },
        duration: String,
      },
    ],
    summary: {
      type: String,
      required: true,
    },
    recommendations: [String],
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'emergency'],
      default: 'low',
    },
    sentToDoctor: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AiSummary', aiSummarySchema);

