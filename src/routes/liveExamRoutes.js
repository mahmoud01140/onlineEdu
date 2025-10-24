const express = require('express');
const liveExamController = require('../controller/liveExamController');
const {protect} = require('../controller/authController');

const router = express.Router();

router.get('/', protect, liveExamController.getAllLiveEx);
router.post('/create', protect, liveExamController.createLiveEx);
router.get('/upcoming', protect, liveExamController.getUpcomingLiveEx);
router.get('/:id', protect, liveExamController.getLiveExById);
router.put('/:id', protect, liveExamController.updateLiveEx);
router.delete('/:id', protect, liveExamController.deleteLiveEx);
router.post('/:id/add-user', protect, liveExamController.addUser);
module.exports = router;