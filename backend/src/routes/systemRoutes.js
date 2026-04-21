const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/auth');
const { getStats } = require('../controllers/systemController');

router.get('/stats', requireAuth, getStats);

module.exports = router;
