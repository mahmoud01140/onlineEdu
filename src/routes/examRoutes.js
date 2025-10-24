const express = require("express");
const examController = require("../controller/examController");
const { protect } = require("../controller/authController");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

// الجميع يمكنهم الوصول إلى هذه المسارات
router.get("/", protect, examController.getExams);
router.post("/:id/submit", protect, examController.submitExam);
router.get("/:type", protect, examController.getExamByType);
router.get("/lesson/:lessonId", protect, examController.fetchLessonExams);
// مسارات تحتاج إلى صلاحية المشرف
router.post("/", protect, isAdmin, examController.createExam);
router.put("/:id", protect, isAdmin, examController.updateExam);
router.delete("/:id", protect, isAdmin, examController.deleteExam);

module.exports = router;
