const mongoose = require('mongoose');

const chatSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'archived', 'locked'],
      default: 'active',
    },
    title: {
      type: String,
      default: 'New Chat Session',
    },
    // Conversation phase tracking
    phase: {
      type: String,
      enum: ['profile_intake', 'medical_background', 'symptom_collection', 'finalized'],
      default: 'profile_intake',
    },
    // Track which structured fields have been collected
    collectedFields: {
      firstName: { type: Boolean, default: false },
      lastName: { type: Boolean, default: false },
      age: { type: Boolean, default: false },
      height: { type: Boolean, default: false },
      weight: { type: Boolean, default: false },
      medicalBackground: { type: Boolean, default: false },
    },
    // Track if symptom collection is complete
    symptomCollectionComplete: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);

