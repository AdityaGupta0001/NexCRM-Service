const express = require('express');
const router = express.Router();
const dataIngestionController = require('../controllers/dataIngestionController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// Admin-only access to upload customer data
router.post('/customers', isAuthenticated, isAdmin, dataIngestionController.uploadCustomers);

// Admin-only access to upload order data
router.post('/orders', isAuthenticated, isAdmin, dataIngestionController.uploadOrders);

module.exports = router;