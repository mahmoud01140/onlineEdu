const express = require("express");
const userController = require("../controller/userController");
// const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const { protect } = require("../controller/authController");
const router = express.Router();

// مسارات عامة (تتطلب مصادقة)
router.get("/", protect ,isAdmin, userController.getAllUsers);
router.get("/stats", protect ,isAdmin, userController.getUserStats);
router.get("/search", protect ,isAdmin, userController.searchUsers);
router.get("/without-groups", protect ,isAdmin, userController.getUsersWithoutGroups);
router.get("/export", protect ,isAdmin, userController.exportUsers);
// router.post("/exams/:examId",  userController.createUserExamResult);
// مسارات تحتاج إلى صلاحية المشرف
router.post("/", protect ,isAdmin, userController.createUser);
router.get("/:id", protect ,isAdmin, userController.getUser);
router.patch("/:id", protect ,isAdmin, userController.updateUser);
router.delete("/:id", protect ,isAdmin, userController.deleteUser);
router.patch("/:id/toggle-status", protect ,isAdmin, userController.toggleUserStatus);
router.patch("/:id/level", protect ,isAdmin, userController.updateUserLevel);
router.patch("/:id/role", protect ,isAdmin, userController.updateUserRole);
router.post("/:id/add-to-group", protect ,isAdmin, userController.addUserToGroup);
router.post("/:id/remove-from-group", protect ,isAdmin, userController.removeUserFromGroup);
router.get("/:id/groups", protect ,isAdmin, userController.getUserGroups);


module.exports = router;