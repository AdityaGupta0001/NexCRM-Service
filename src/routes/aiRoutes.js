const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isEmployeeOrAdmin } = require('../middlewares/roleMiddleware');

router.post('/parse-segment', isAuthenticated, isEmployeeOrAdmin, aiController.parseSegmentFromPrompt);
router.post('/message-suggestions', isAuthenticated, isEmployeeOrAdmin, aiController.suggestMessages);

module.exports = router;