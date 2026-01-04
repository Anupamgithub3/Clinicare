const express = require('express');
const cors = require('cors');

const app = express();

// ✅ CORS CONFIG — THIS IS THE FIX
app.use(cors({
  origin: [
    'https://clinicare-frontend.onrender.com',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// routes
app.use('/api/auth', require('./routes/auth.routes'));
// keep other routes as-is

module.exports = app;
