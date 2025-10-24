const express = require("express");
const courseController = require("../controller/courseController");
const isAdmin = require("../middleware/isAdmin");


const router = express.Router();

// جميع المستخدمين يمكنهم الوصول إلى هذه المسارات
router.get("/", courseController.getAllCourses);
// router.get("/stats", courseController.getCourseStats);
// router.get("/:id", courseController.getCourse);
// router.get("/category/:category", courseController.getCoursesByCategory);

// يجب أن يكون المستخدم مسجلاً للوصول إلى هذه المسارات

// مسارات تحتاج إلى صلاحية المشرف
router.post("/", courseController.createCourse);
// router.patch("/:id", isAdmin, courseController.updateCourse);
router.delete("/:id", courseController.deleteCourse);
// router.patch("/:id/toggle-active", isAdmin, courseController.toggleCourseActive);

// مسارات للمستخدمين المسجلين (بدون صلاحية المشرف)
// router.patch("/:id/increment-students", courseController.incrementStudents);
// router.patch("/:id/update-rating", courseController.updateRating);
// router.post("/:id/enroll", courseController.enrollInCourse);

module.exports = router;