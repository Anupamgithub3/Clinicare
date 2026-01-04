const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (Render needs this)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes (keep these if you already had them)
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/doctor', require('./routes/doctor.routes'));
app.use('/api/pharmacy', require('./routes/pharmacy.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/department', require('./routes/department.routes'));

module.exports = app;
