const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    medicine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: false
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    batchId: {
        type: String,
        default: 'legacy'
    },
    totalQuantity: {
        type: Number,
        default: 0,
        min: 0
    },
    remainingQuantity: {
        type: Number,
        required: true,
        min: 0
    },
    notes: String,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for quick lookup of a patient's active prescriptions for a specific medicine
prescriptionSchema.index({ patient: 1, medicine: 1, isActive: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
