const express = require("express");
const studyController = require("../controller/studyController");
const {protect} = require("../controller/authController");
const router = express.Router();
const isPassFirstExams = require("../middleware/isPassFirstExams");
// جميع المستخدمين المسجلين يمكنهم الوصول إلى هذه المسارات
router.get("/lessons", protect, isPassFirstExams, studyController.getUserLessons);

module.exports = router;   