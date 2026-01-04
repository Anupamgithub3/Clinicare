const express = require('express');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Clinicare backend is live',
    timestamp: new Date().toISOString(),
  });
});

module.exports = app;
