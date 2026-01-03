const ChatSession = require('../models/ChatSession');
const ChatMessage = require('../models/ChatMessage');
const AiSummary = require('../models/AiSummary');
const DoctorInbox = require('../models/DoctorInbox');
const { analyzeSymptoms, generateResponse } = require('../ai/symptomsService');
const User = require('../models/user');

// @desc    Create a new chat session
// @route   POST /api/chat/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const session = await ChatSession.create({
      userId: req.user.id,
      title: req.body.title || 'New Chat Session',
      phase: 'profile_intake',
      collectedFields: {
        firstName: false,
        lastName: false,
        age: false,
        height: false,
        weight: false,
        medicalBackground: false,
      },
    });

    const greetingMessage = await ChatMessage.create({
      sessionId: session._id,
      role: 'assistant',
      content:
        "Hello! I'm your medical intake assistant. What symptoms are you experiencing?",
    });

    res.status(201).json({
      success: true,
      session,
      initialMessage: greetingMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all chat sessions
const getSessions = async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get single session
const getSession = async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Send message & get AI reply
const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    const { sessionId } = req.params;

    const session = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return res
        .status(404)
        .json({ success: false, message: 'Session not found' });
    }

    const userMessage = await ChatMessage.create({
      sessionId,
      role: 'user',
      content,
    });

    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .select('role content');

    const aiResult = await generateResponse(messages, session, req.user);

    const aiMessage = await ChatMessage.create({
      sessionId,
      role: 'assistant',
      content: aiResult.response,
    });

    res.status(201).json({
      success: true,
      messages: [userMessage, aiMessage],
      phase: aiResult.phase || session.phase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Get all messages
const getMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      sessionId: req.params.sessionId,
    }).sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Delete session
const deleteSession = async (req, res) => {
  try {
    await ChatSession.deleteOne({
      _id: req.params.sessionId,
      userId: req.user.id,
    });

    await ChatMessage.deleteMany({ sessionId: req.params.sessionId });

    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc End session & generate summary
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const messages = await ChatMessage.find({ sessionId }).sort({
      createdAt: 1,
    });

    if (!messages.length) {
      return res
        .status(400)
        .json({ success: false, message: 'No messages found' });
    }

    // Check if summary already exists for this session
    let summary = await AiSummary.findOne({ sessionId });

    if (!summary) {
      summary = await analyzeSymptoms(messages, sessionId, req.user.id);
    }

    // Get doctorId from request body or fallback to first doctor
    let doctorId = req.body.doctorId;

    if (!doctorId) {
      const doctor = await User.findOne({ role: 'doctor' });
      doctorId = doctor?._id || req.user.id;
    }

    await DoctorInbox.create({
      doctorId: doctorId,
      patientId: req.user.id,
      sessionId,
      summaryId: summary._id,
    });


    res.json({
      success: true,
      message: 'Session ended and summary sent to doctor',
      summary,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  getMessages,
  deleteSession,
  endSession,
};
