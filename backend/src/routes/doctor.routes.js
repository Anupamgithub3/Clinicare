const express = require('express');
const router = express.Router();
const {
  getInbox,
  getInboxItem,
  updateInboxStatus,
  addDoctorNotes,
  getPatientSummary,
  prescribeMedicine,
  prescribeBatch,
} = require('../controllers/doctor.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All doctor routes require authentication and doctor role
router.use(protect);
router.use(authorize('doctor'));

router.get('/inbox', getInbox);
router.get('/inbox/:inboxId', getInboxItem);
router.put('/inbox/:inboxId/status', updateInboxStatus);
router.put('/inbox/:inboxId/notes', addDoctorNotes);
router.get('/summary/:summaryId', getPatientSummary);
router.post('/prescribe', prescribeMedicine);
router.post('/prescribe-batch', prescribeBatch);

module.exports = router;

