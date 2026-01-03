const DoctorInbox = require('../models/DoctorInbox');
const AiSummary = require('../models/AiSummary');
const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const Prescription = require('../models/Prescription');

// @desc    Get doctor's inbox
// @route   GET /api/doctor/inbox
// @access  Private/Doctor
const getInbox = async (req, res) => {
  try {
    const { status, priority, patientId } = req.query;
    const query = { doctorId: req.user.id };

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (patientId) query.patientId = patientId;

    const inboxItems = await DoctorInbox.find(query)
      .populate('sessionId', 'title createdAt')
      .populate('patientId', 'name email')
      .populate('summaryId', 'symptoms summary urgency')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: inboxItems.length,
      inbox: inboxItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single inbox item
// @route   GET /api/doctor/inbox/:inboxId
// @access  Private/Doctor
const getInboxItem = async (req, res) => {
  try {
    const inboxItem = await DoctorInbox.findOne({
      _id: req.params.inboxId,
      doctorId: req.user.id,
    })
      .populate('sessionId')
      .populate('patientId', 'name email phone dateOfBirth')
      .populate('summaryId');

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found',
      });
    }

    // Get chat messages for this session
    const messages = await ChatMessage.find({
      sessionId: inboxItem.sessionId._id,
    })
      .sort({ createdAt: 1 })
      .select('role content createdAt');

    res.status(200).json({
      success: true,
      inboxItem: {
        ...inboxItem.toObject(),
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update inbox item status
// @route   PUT /api/doctor/inbox/:inboxId/status
// @access  Private/Doctor
const updateInboxStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const inboxItem = await DoctorInbox.findOneAndUpdate(
      {
        _id: req.params.inboxId,
        doctorId: req.user.id,
      },
      { status },
      { new: true, runValidators: true }
    );

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found',
      });
    }

    res.status(200).json({
      success: true,
      inboxItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add doctor notes to inbox item
// @route   PUT /api/doctor/inbox/:inboxId/notes
// @access  Private/Doctor
const addDoctorNotes = async (req, res) => {
  try {
    const { notes } = req.body;

    const inboxItem = await DoctorInbox.findOneAndUpdate(
      {
        _id: req.params.inboxId,
        doctorId: req.user.id,
      },
      { doctorNotes: notes },
      { new: true, runValidators: true }
    );

    if (!inboxItem) {
      return res.status(404).json({
        success: false,
        message: 'Inbox item not found',
      });
    }

    res.status(200).json({
      success: true,
      inboxItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get patient summary
// @route   GET /api/doctor/summary/:summaryId
// @access  Private/Doctor
const getPatientSummary = async (req, res) => {
  try {
    const summary = await AiSummary.findById(req.params.summaryId)
      .populate('userId', 'name email phone dateOfBirth')
      .populate('sessionId', 'title createdAt');

    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'Summary not found',
      });
    }

    res.status(200).json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Prescribe medicine to patient
// @route   POST /api/doctor/prescribe
// @access  Private/Doctor
const prescribeMedicine = async (req, res) => {
  try {
    const { patientId, medicineId, quantity, notes } = req.body;
    const batchId = Date.now().toString(); // Simple unique batch ID

    if (!patientId || (!medicineId && medicineId !== 'not_available')) {
      return res.status(400).json({
        success: false,
        message: 'Please provide patientId and select a medicine',
      });
    }

    if (medicineId === 'not_available' && (!notes || notes.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the recommended medicine in the notes since it is not in the pharmacy list.',
      });
    }

    let prescription;

    if (medicineId && medicineId !== 'not_available') {
      // Create a fresh recommendation record every time to ensure distinct sessions
      prescription = await Prescription.create({
        patient: patientId,
        medicine: medicineId,
        doctor: req.user.id,
        batchId,
        totalQuantity: quantity,
        remainingQuantity: quantity,
        notes
      });
    } else {
      // Medicine not available in system
      prescription = await Prescription.create({
        patient: patientId,
        medicine: null,
        doctor: req.user.id,
        batchId,
        totalQuantity: 0,
        remainingQuantity: 0,
        notes: `[UNLISTED MEDICINE] ${notes}`
      });
    }

    res.status(201).json({
      success: true,
      message: medicineId === 'not_available'
        ? 'Recommendation for unlisted medicine recorded'
        : 'Medicine prescribed successfully',
      prescription,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Prescribe multiple medicines at once
// @route   POST /api/doctor/prescribe-batch
// @access  Private/Doctor
const prescribeBatch = async (req, res) => {
  try {
    const { patientId, items } = req.body; // items: [{ medicineId, quantity, notes }]
    const batchId = Date.now().toString();

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide patientId and a list of medicines to prescribe',
      });
    }

    const prescriptions = [];

    for (const item of items) {
      const { medicineId, quantity, notes } = item;

      if (!medicineId) continue;

      let prescription;

      if (medicineId !== 'not_available') {
        // Create fresh records for every item in the batch
        prescription = await Prescription.create({
          patient: patientId,
          medicine: medicineId,
          doctor: req.user.id,
          batchId,
          totalQuantity: quantity,
          remainingQuantity: quantity,
          notes
        });
      } else {
        prescription = await Prescription.create({
          patient: patientId,
          medicine: null,
          doctor: req.user.id,
          batchId,
          totalQuantity: 0,
          remainingQuantity: 0,
          notes: `[UNLISTED MEDICINE] ${notes}`
        });
      }
      prescriptions.push(prescription);
    }

    res.status(201).json({
      success: true,
      message: 'Batch prescriptions sent successfully',
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getInbox,
  getInboxItem,
  updateInboxStatus,
  addDoctorNotes,
  getPatientSummary,
  prescribeMedicine,
  prescribeBatch,
};
