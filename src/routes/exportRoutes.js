// routes/exportRoutes.js
const express = require("express");
const router = express.Router();
const exportController = require("../controller/exportController");
const { protect } = require("../controller/authController");
const isAdmin = require("../middleware/isAdmin");

router.get("/users", protect, exportController.exportUsers);
// router.get("/users/:userId", protect, exportController.exportUserDetails);


router.get('/attendance', exportController.exportAttendance);
module.exports = router;
