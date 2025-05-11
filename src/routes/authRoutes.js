const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// Initiate Google OAuth flow
router.get('/google', authController.googleLogin);

// Google OAuth callback
router.get('/google/callback', authController.googleCallback);

// Logout
router.post('/logout', isAuthenticated, authController.logout); // Changed to POST as per REST best practices for actions

// Get current user
router.get('/me', authController.getCurrentUser);

module.exports = router;