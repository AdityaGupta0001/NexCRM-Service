const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isEmployeeOrAdmin } = require('../middlewares/roleMiddleware');

router.post('/send', isAuthenticated, isEmployeeOrAdmin, campaignController.sendCampaign);
router.get('/', isAuthenticated, isEmployeeOrAdmin, campaignController.getCampaignHistory);
router.post('/delivery-receipt', campaignController.updateDeliveryStatus);

module.exports = router;