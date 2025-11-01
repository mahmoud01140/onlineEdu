const express = require("express");
const courseController = require("../controller/courseController");
const isAdmin = require("../middleware/isAdmin");
const { protect } = require("../controller/authController");

const router = express.Router();

// جميع المستخدمين يمكنهم الوصول إلى هذه المسارات
router.get("/", courseController.getAllCourses);
// مسارات تحتاج إلى صلاحية المشرف
router.post("/", protect ,isAdmin, courseController.createCourse);
// router.patch("/:id", isAdmin, courseController.updateCourse);
router.delete("/:id",protect ,isAdmin, courseController.deleteCourse);


module.exports = router;