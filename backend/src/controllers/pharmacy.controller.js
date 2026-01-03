const Medicine = require('../models/Medicine');
const Order = require('../models/Order');
const Prescription = require('../models/Prescription');

// @desc    Get all medicines (Searchable + Prescription check for patients)
// @route   GET /api/pharmacy
// @access  Private
const getMedicines = async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        let medicines = await Medicine.find(query).lean();

        // If patient, attach active prescription info
        if (req.user.role === 'patient') {
            const prescriptions = await Prescription.find({
                patient: req.user.id,
                isActive: true
            }).lean();

            medicines = medicines.map(m => {
                const prescription = prescriptions.find(p => p.medicine.toString() === m._id.toString());
                return {
                    ...m,
                    prescribed: !!prescription,
                    allowedQuantity: prescription ? prescription.remainingQuantity : 0
                };
            });
        }

        res.json({ success: true, medicines });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Buy medicine (Patient only)
// @route   POST /api/pharmacy/buy/:id
// @access  Private/Patient
const buyMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ success: false, message: 'Medicine not found' });
        }

        if (medicine.stock <= 0) {
            return res.status(400).json({ success: false, message: 'Out of stock' });
        }

        // Mock purchase: reduce stock
        medicine.stock -= 1;
        await medicine.save();

        res.json({
            success: true,
            message: `Successfully purchased ${medicine.name}`,
            medicine
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Checkout cart (Patient only - Restricted by Prescription)
// @route   POST /api/pharmacy/checkout
// @access  Private/Patient
const checkout = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, quantity }

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        let totalAmount = 0;
        const processedItems = [];

        for (const item of items) {
            const medicine = await Medicine.findById(item.id);
            if (!medicine) {
                return res.status(404).json({ success: false, message: `Medicine ${item.id} not found` });
            }

            // Prescription check
            let prescription;
            if (item.prescriptionId) {
                prescription = await Prescription.findById(item.prescriptionId);
            } else {
                // Fallback for general inventory or older clients
                prescription = await Prescription.findOne({
                    patient: req.user.id,
                    medicine: medicine._id,
                    isActive: true
                });
            }

            if (!prescription) {
                return res.status(403).json({
                    success: false,
                    message: `You can only buy medicines recommended by a doctor. ${medicine.name} is not on your list.`
                });
            }

            if (prescription.remainingQuantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `You can only buy up to ${prescription.remainingQuantity} units of ${medicine.name} as per doctor recommendation.`
                });
            }

            if (medicine.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for ${medicine.name}` });
            }

            // Deduct stock and prescription quantity
            medicine.stock -= item.quantity;
            await medicine.save();

            prescription.remainingQuantity -= item.quantity;
            if (prescription.remainingQuantity <= 0) {
                prescription.isActive = false;
            }
            await prescription.save();

            totalAmount += medicine.price * item.quantity;
            processedItems.push({
                medicine: medicine._id,
                name: medicine.name,
                quantity: item.quantity,
                price: medicine.price
            });
        }

        const order = await Order.create({
            patient: req.user.id,
            items: processedItems,
            totalAmount
        });

        res.status(201).json({
            success: true,
            message: 'Order completed successfully',
            order
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get patient's active prescriptions (including unlisted)
// @route   GET /api/pharmacy/prescriptions
// @access  Private/Patient
const getMyPrescriptions = async (req, res) => {
    try {
        const prescriptions = await Prescription.find({
            patient: req.user.id
        })
            .populate('medicine', 'name price')
            .populate('doctor', 'name')
            .lean();

        res.json({ success: true, prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getMedicines,
    buyMedicine,
    checkout,
    getMyPrescriptions,
};
