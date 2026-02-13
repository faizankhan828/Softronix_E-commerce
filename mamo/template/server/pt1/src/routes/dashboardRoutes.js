const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Get dashboard statistics (admin only)
router.get('/stats', isAuthenticated, isAdmin, dashboardController.getDashboardStats);

module.exports = router;
