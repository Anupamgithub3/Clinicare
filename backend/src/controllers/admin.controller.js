const Medicine = require('../models/Medicine');

// @desc    Get all medicines
// @route   GET /api/admin/pharmacy
// @access  Private/Admin
const getMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find();
        res.json({ success: true, medicines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add medicine
// @route   POST /api/admin/pharmacy
// @access  Private/Admin
const addMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.create(req.body);
        res.status(201).json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update medicine
// @route   PUT /api/admin/pharmacy/:id
// @access  Private/Admin
const updateMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }
        res.json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete medicine
// @route   DELETE /api/admin/pharmacy/:id
// @access  Private/Admin
const deleteMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }
        res.json({ success: true, message: 'Medicine deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
};
