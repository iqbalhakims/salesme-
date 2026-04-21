const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const dashboardRoutes = require('./routes/dashboardRoutes');
const carRoutes = require('./routes/carRoutes');
const leadRoutes = require('./routes/leadRoutes');
const messageRoutes = require('./routes/messageRoutes');
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const systemRoutes = require('./routes/systemRoutes');
const userRoutes = require('./routes/userRoutes');
const { seedAdmin } = require('./controllers/authController');

const pool = require('./config/database');
const requestMetrics = require('./middleware/requestMetrics');

const app = express();
const PORT = process.env.PORT || 3000;

async function waitForDb(retries = 10, delayMs = 3000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('DB connection established');
      return;
    } catch (err) {
      console.log(`DB not ready (attempt ${i}/${retries}): ${err.message}`);
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

app.use(cors());
app.use(express.json());
app.use(requestMetrics);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/cars/:id/videos', videoRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Car Sales CRM API is running' });
});

waitForDb()
  .then(() => seedAdmin())
  .then(() => app.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch(err => { console.error('Could not connect to DB:', err.message); process.exit(1); });

module.exports = app;
