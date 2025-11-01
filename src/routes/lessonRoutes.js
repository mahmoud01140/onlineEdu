const express = require("express");
const lessonController = require("../controller/lessonController");
const {protect} = require("../controller/authController");
const isAdmin = require("../middleware/isAdmin");
const { uploadUserPhoto, uploadMaterial } = require("../utils/multer");
const router = express.Router();

// جميع المستخدمين المسجلين يمكنهم الوصول إلى هذه المسارات
router.get("/", protect, lessonController.getAllLessons);
router.get("/upcoming", protect, lessonController.getUpcomingLessons);
router.get("/past", protect, lessonController.getPastLessons);
router.get("/today", protect, lessonController.getTodayLessons);
router.get("/stats", protect, lessonController.getLessonStats);
router.get("/search", protect, lessonController.searchLessons);
router.get("/group/:groupId", protect, lessonController.getGroupLessons);
router.get("/:id", protect, lessonController.getLesson);

// مسارات تحتاج إلى صلاحية المشرف أو المعلم
router.post("/", protect, isAdmin, lessonController.createLesson);
router.patch("/:id", protect, isAdmin, lessonController.updateLesson);
router.delete("/:id", protect, isAdmin, lessonController.deleteLesson);
router.post("/:id/duplicate", protect, isAdmin, lessonController.duplicateLesson);
router.post("/:id/resources", protect, isAdmin, lessonController.addResource);
router.delete("/:id/resources", protect, isAdmin, lessonController.removeResource);

module.exports = router;