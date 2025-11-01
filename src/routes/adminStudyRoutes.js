// routes/studyRoutes.js
const express = require("express");
const router = express.Router();
const {
  getUpcomingLessons,
  getGroupDetails,
  markAttendance,
  getAttendanceRecords
} = require("../controller/adminStudyController");
const { protect } = require("../controller/authController");
const isAdmin = require("../middleware/isAdmin");

router.get("/upcoming-lessons",protect, isAdmin, getUpcomingLessons);
router.get("/group/:groupId",protect, isAdmin, getGroupDetails);
router.post("/attendance",protect, isAdmin, markAttendance);
router.get("/attendance/:lessonId",protect, isAdmin, getAttendanceRecords);

module.exports = router;