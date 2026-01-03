const Department = require('../models/Department');
const User = require('../models/user');

// @desc    Get all departments (public/basic list)
// @route   GET /api/departments
// @access  Public
const getDepartments = async (req, res) => {
    try {
        const departments = await Department.find().select('name description');
        res.json({ success: true, departments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all departments with member counts (Admin view)
// @route   GET /api/departments/detailed
// @access  Private/Admin
const getDepartmentsDetailed = async (req, res) => {
    try {
        const departments = await Department.find();

        const detailedDepts = await Promise.all(departments.map(async (dept) => {
            const activeCount = await User.countDocuments({ department: dept._id, role: 'doctor', isActive: true });
            const inactiveCount = await User.countDocuments({ department: dept._id, role: 'doctor', isActive: false });
            return {
                ...dept._doc,
                activeCount,
                inactiveCount
            };
        }));

        res.json({ success: true, departments: detailedDepts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        const existing = await Department.findOne({ name: name.trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A department with this name already exists' });
        }
        const department = await Department.create({ name: name.trim(), description });
        res.status(201).json({ success: true, department });
    } catch (error) {
        // Handle duplicate key error explicitly as a fallback
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'A department with this name already exists' });
        }
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get doctors for a department
// @route   GET /api/departments/:deptId/doctors
// @access  Private
const getDoctorsByDepartment = async (req, res) => {
    try {
        const doctors = await User.find({ department: req.params.deptId, role: 'doctor', isActive: true })
            .select('firstName lastName email department');
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get members of a department (Active & Inactive)
// @route   GET /api/departments/:deptId/members
// @access  Private/Admin
const getDepartmentMembers = async (req, res) => {
    try {
        const activeMembers = await User.find({
            department: req.params.deptId,
            role: 'doctor',
            isActive: true
        }).select('firstName lastName email isVerified');

        const inactiveMembers = await User.find({
            department: req.params.deptId,
            role: 'doctor',
            isActive: false
        }).select('firstName lastName email isVerified');

        res.json({ success: true, activeMembers, inactiveMembers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Add a doctor to a department
// @route   POST /api/departments/:deptId/members
// @access  Private/Admin
const addMemberToDepartment = async (req, res) => {
    try {
        const { doctorId, email } = req.body;
        const deptId = req.params.deptId;
        let user = null;
        if (doctorId) user = await User.findById(doctorId);
        else if (email) user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) return res.status(404).json({ success: false, message: 'Doctor not found' });
        if (user.role !== 'doctor') return res.status(400).json({ success: false, message: 'User is not a doctor' });

        user.department = deptId;
        user.isActive = true;
        await user.save();

        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Remove a doctor from their department
// @route   DELETE /api/departments/members/:doctorId
// @access  Private/Admin
const removeMemberFromDepartment = async (req, res) => {
    try {
        const user = await User.findById(req.params.doctorId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.department = null;
        user.isActive = false;
        await user.save();

        res.json({ success: true, message: 'Doctor removed from department', user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Toggle doctor active status
// @route   PUT /api/departments/members/:doctorId/status
// @access  Private/Admin
const toggleMemberStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.doctorId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        user.isActive = !user.isActive;
        await user.save();

        res.json({ success: true, message: `Status updated to ${user.isActive ? 'Active' : 'Inactive'}`, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getDepartments,
    getDepartmentsDetailed,
    getDoctorsByDepartment,
    createDepartment,
    getDepartmentMembers,
    addMemberToDepartment,
    removeMemberFromDepartment,
    toggleMemberStatus
};
