const express = require("express");
const {
  signupStudent,
  login,
  logout,
  checkAuth,
  protect,
  // googleAuth,
  profile,
  // forgotPassword,
  // resetPassword,
  // updateProfile,
  signupTeacher,
  signupElder,
} = require("../controller/authController");
const {uploadUserPhoto} = require("../utils/multer")
const router = express.Router();
router.post("/register/student", signupStudent);
router.post("/register/teacher", signupTeacher);
router.post("/register/elder", signupElder);
router.post("/login", login);
router.post("/logout", logout);
// router.post("/google", googleAuth);
router.get("/check", protect, checkAuth);
router.get("/profile", protect, profile);
// router.post("/forget-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);
// router.patch("/update-profile",protect, uploadUserPhoto ,updateProfile);
// router.post("/updateProfile", protect, updateProfile);
module.exports = router;
