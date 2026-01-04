const app = require('./app');
require('dotenv').config(); // Load env vars before anything else
const connectDB = require('./config/db');

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
