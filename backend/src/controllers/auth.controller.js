const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, department } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Determine verification status
    // Doctors need verification (isVerified: false), Patients don't (isVerified: true)
    const isVerified = role !== 'doctor';

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`, // Maintain legacy name field
      email,
      password,
      role: role || 'patient',
      department: role === 'doctor' ? department : undefined,
      isVerified
    });

    // Only generate token if verified (patients)
    let token = null;
    if (user.isVerified) {
      token = generateToken(user._id);
    }

    res.status(201).json({
      success: true,
      token,
      message: user.isVerified
        ? 'Registration successful'
        : 'Registration successful. Please wait for admin verification before logging in.',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check verification status
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin verification. Please try again later.',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.firstName ? (user.firstName + ' ' + (user.lastName || '')) : user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify/Approve a doctor (Admin only)
// @route   PUT /api/auth/verify/:id
// @access  Private/Admin
const verifyDoctor = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Only doctor accounts can be verified',
      });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Doctor ${user.firstName} ${user.lastName} has been verified`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get pending verifications (Admin only)
// @route   GET /api/auth/pending-verifications
// @access  Private/Admin
const getPendingVerifications = async (req, res) => {
  try {
    const pendingDoctors = await User.find({
      role: 'doctor',
      isVerified: false
    }).populate('department', 'name');

    res.status(200).json({
      success: true,
      pendingDoctors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  verifyDoctor,
  getPendingVerifications
};

