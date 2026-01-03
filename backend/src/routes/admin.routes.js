const express = require('express');
const router = express.Router();
const {
    getMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/pharmacy')
    .get(getMedicines)
    .post(addMedicine);

router.route('/pharmacy/:id')
    .put(updateMedicine)
    .delete(deleteMedicine);

module.exports = router;
