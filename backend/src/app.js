const express = require('express');


const app = express();

/* -------------------- CORS CONFIG -------------------- */

const cors = require('cors');

const allowedOrigins = [
  'https://clinicare-frontend.onrender.com',
  'https://clinicare1.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (Render, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(null, true); // ⬅ IMPORTANT: do NOT hard-fail on Render
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 🔥 Explicit preflight support
app.options('*', cors());


/* -------------------- MIDDLEWARE -------------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Clinicare backend is live',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/departments', require('./routes/department.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/pharmacy', require('./routes/pharmacy.routes'));

/* -------------------- EXPORT -------------------- */

module.exports = app;
