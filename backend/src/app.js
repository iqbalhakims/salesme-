const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const carRoutes = require('./routes/carRoutes');
const leadRoutes = require('./routes/leadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/cars/:id/videos', videoRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Car Sales CRM API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
