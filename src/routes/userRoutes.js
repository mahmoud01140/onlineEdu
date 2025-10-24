const express = require("express");
const userController = require("../controller/userController");
// const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

const router = express.Router();

// مسارات عامة (تتطلب مصادقة)
router.get("/", userController.getAllUsers);
router.get("/stats",  userController.getUserStats);
router.get("/search", userController.searchUsers);
router.get("/without-groups",  userController.getUsersWithoutGroups);
router.get("/export",  userController.exportUsers);
// router.post("/exams/:examId",  userController.createUserExamResult);
// مسارات تحتاج إلى صلاحية المشرف
router.post("/",  userController.createUser);
router.get("/:id", userController.getUser);
router.patch("/:id",  userController.updateUser);
router.delete("/:id",  userController.deleteUser);
router.patch("/:id/toggle-status",  userController.toggleUserStatus);
router.patch("/:id/level",  userController.updateUserLevel);
router.patch("/:id/role",  userController.updateUserRole);
router.post("/:id/add-to-group",  userController.addUserToGroup);
router.post("/:id/remove-from-group",  userController.removeUserFromGroup);
router.get("/:id/groups", userController.getUserGroups);


module.exports = router;