const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  verifyDoctor,
  getPendingVerifications
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/verify/:id', protect, authorize('admin'), verifyDoctor);
router.get('/pending-verifications', protect, authorize('admin'), getPendingVerifications);

module.exports = router;



