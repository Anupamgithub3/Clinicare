const express = require('express');
const router = express.Router();

const {
  createSession,
  getSessions,
  getSession,
  sendMessage,
  getMessages,
  deleteSession,
  endSession,
} = require('../controllers/chat.controller');

const { protect } = require('../middleware/auth.middleware');

router.post('/sessions', protect, createSession);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:sessionId', protect, getSession);
router.post('/sessions/:sessionId/messages', protect, sendMessage);
router.get('/sessions/:sessionId/messages', protect, getMessages);
router.delete('/sessions/:sessionId', protect, deleteSession);
router.post('/sessions/:sessionId/end', protect, endSession);

module.exports = router;
