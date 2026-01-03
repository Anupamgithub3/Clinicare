const express = require('express');
const router = express.Router();
const { getMedicines, buyMedicine, checkout, getMyPrescriptions } = require('../controllers/pharmacy.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);

router.get('/', getMedicines);
router.get('/prescriptions', authorize('patient'), getMyPrescriptions);
router.post('/buy/:id', authorize('patient'), buyMedicine);
router.post('/checkout', authorize('patient'), checkout);

module.exports = router;
