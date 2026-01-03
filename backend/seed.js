const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./src/models/user');
const Department = require('./src/models/Department');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // 1. Create Department
        const dept = await Department.findOneAndUpdate(
            { name: 'General Medicine' },
            { description: 'Primary care and general health checkups.' },
            { upsert: true, new: true }
        );
        console.log('Department created:', dept.name);

        const password = 'password123';

        // 2. Create Admin
        const admin = await User.findOneAndUpdate(
            { email: 'admin@clinic.com' },
            {
                firstName: 'System',
                lastName: 'Admin',
                name: 'Admin User',
                role: 'admin',
                isVerified: true,
                password: password // User model hashes this in pre-save
            },
            { upsert: true, new: true }
        );
        // Force re-save to trigger bcrypt hash if password was updated as plain text
        admin.password = password;
        await admin.save();
        console.log('Admin created: admin@clinic.com / password123');

        // 3. Create Doctor
        const doctor = await User.findOneAndUpdate(
            { email: 'doctor@clinic.com' },
            {
                name: 'Dr. Smith',
                firstName: 'John',
                lastName: 'Smith',
                role: 'doctor',
                department: dept._id
            },
            { upsert: true, new: true }
        );
        doctor.password = password;
        await doctor.save();
        console.log('Doctor created: doctor@clinic.com / password123');

        // 4. Create Patient
        const patient = await User.findOneAndUpdate(
            { email: 'patient@clinic.com' },
            {
                name: 'Jane Doe',
                firstName: 'Jane',
                lastName: 'Doe',
                role: 'patient'
            },
            { upsert: true, new: true }
        );
        patient.password = password;
        await patient.save();
        console.log('Patient created: patient@clinic.com / password123');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedDB();
