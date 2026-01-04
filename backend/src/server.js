const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB (non-blocking)
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in production mode on port ${PORT}`);
});

// DO NOT EXIT PROCESS IN PRODUCTION (Render free tier)
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});
