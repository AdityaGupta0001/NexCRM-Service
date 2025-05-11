const express = require('express');
const router = express.Router();
const dataIngestionController = require('../controllers/dataIngestionController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isAdmin, isEmployeeOrAdmin } = require('../middlewares/roleMiddleware');

router.post('/customers', isAuthenticated, isAdmin, dataIngestionController.uploadCustomers);
router.get('/customers', isAuthenticated, isEmployeeOrAdmin, dataIngestionController.getAllCustomers);
router.post('/orders', isAuthenticated, isAdmin, dataIngestionController.uploadOrders);
router.get('/orders', isAuthenticated, isEmployeeOrAdmin, dataIngestionController.getAllOrders);

module.exports = router;