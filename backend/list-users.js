const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/user');

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
        const users = await User.find({}, 'email role name');
        console.log('Existing Users:');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

listUsers();
