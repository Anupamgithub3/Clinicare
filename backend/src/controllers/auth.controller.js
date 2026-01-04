const User = require('../models/user');
const jwt = require('jsonwebtoken');

/* -------------------------------------------------- */
/* Utility */
/* -------------------------------------------------- */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'clinicare-dev-secret';
  if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in your environment for production.');
  }
  try {
    return jwt.sign({ id: user._id, role: user.role }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  } catch (err) {
    console.error('JWT SIGN ERROR:', err);
    throw new Error('Failed to generate authentication token');
  }
};

/* -------------------------------------------------- */
/* REGISTER */
/* -------------------------------------------------- */
exports.register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      userType,
      accountType,
      firstName,
      lastName,
      ...rest
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // 🔥 Normalize role from frontend
    const normalizedRole = (role || userType || accountType || 'patient')
      .toString()
      .toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists',
      });
    }

    console.log('REGISTER PAYLOAD:', { email, role: normalizedRole, firstName, lastName, department: rest.department });

    const user = await User.create({
      email,
      password,
      role: normalizedRole,
      firstName,
      lastName,
      ...rest,
      isVerified: normalizedRole === 'doctor' ? false : true,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('REGISTER ERROR:', error);
    // Duplicate key (e.g., unique email)
    if (error.code === 11000 && error.keyValue) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`,
      });
    }

    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message).join('. ');
      return res.status(400).json({ success: false, message: messages });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

/* -------------------------------------------------- */
/* LOGIN */
/* -------------------------------------------------- */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('LOGIN ATTEMPT:', { email });

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('LOGIN FAILURE - user not found for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    if (user.role === 'doctor' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Doctor account is not verified yet',
      });
    }

    let isMatch = false;
    try {
      isMatch = await user.comparePassword(password);
    } catch (err) {
      console.error('PASSWORD COMPARE ERROR for', email, err);
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }

    if (!isMatch) {
      console.log('LOGIN FAILURE - invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

/* -------------------------------------------------- */
/* GET ME */
/* -------------------------------------------------- */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* -------------------------------------------------- */
/* UPDATE PROFILE */
/* -------------------------------------------------- */
exports.updateProfile = async (req, res) => {
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

/* -------------------------------------------------- */
/* VERIFY DOCTOR (ADMIN) */
/* -------------------------------------------------- */
exports.verifyDoctor = async (req, res) => {
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

/* -------------------------------------------------- */
/* GET PENDING VERIFICATIONS (ADMIN) */
/* -------------------------------------------------- */
exports.getPendingVerifications = async (req, res) => {
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
