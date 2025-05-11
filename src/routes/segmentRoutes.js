const express = require('express');
const router = express.Router();
const segmentController = require('../controllers/segmentController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { isEmployeeOrAdmin } = require('../middlewares/roleMiddleware'); // Allow both roles

router.post('/create', isAuthenticated, isEmployeeOrAdmin, segmentController.createSegment);
router.post('/preview', isAuthenticated, isEmployeeOrAdmin, segmentController.previewSegment); // Changed to POST as discussed
router.get('/', isAuthenticated, isEmployeeOrAdmin, segmentController.listSegments);
router.get('/:id', isAuthenticated, isEmployeeOrAdmin, segmentController.getSegmentDetails);
router.get('/:id/audience', isAuthenticated, isEmployeeOrAdmin, segmentController.getSegmentAudience);


module.exports = router;