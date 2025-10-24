const express = require("express");
const groupController = require("../controller/groupController");
const isAdmin = require("../middleware/isAdmin");
const {protect} = require ("../controller/authController");
const router = express.Router();

// جميع المستخدمين يمكنهم الوصول إلى هذه المسارات
router.get("/", protect, groupController.getAllGroups);
router.get("/stats", protect, groupController.getGroupStats);
router.get("/search", protect, groupController.searchGroups);
router.get("/:id", protect, groupController.getGroup);
// يجب أن يكون المستخدم مسجلاً للوصول إلى هذه المسارا
// مسارات تحتاج إلى صلاحية المشرف
router.post("/", protect, isAdmin, groupController.createGroup);
router.patch("/:id", protect, isAdmin, groupController.updateGroup);
router.delete("/:id", protect, isAdmin, groupController.deleteGroup);
router.post("/:id/add-student", protect, isAdmin, groupController.addStudentToGroup);
router.post("/:id/remove-student", protect, isAdmin, groupController.removeStudentFromGroup);

module.exports = router;