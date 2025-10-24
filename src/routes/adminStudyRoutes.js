// routes/studyRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUpcomingLessons,
  getGroupDetails,
  markAttendance,
  getAttendanceRecords
} = require("../controller/adminStudyController");
// const { authMiddleware, authorize } = require("../middleware/auth");

// router.use(authMiddleware);

router.get("/upcoming-lessons", getUpcomingLessons);
router.get("/group/:groupId", getGroupDetails);
router.post("/attendance", markAttendance);
router.get("/attendance/:lessonId", getAttendanceRecords);

module.exports = router;