const express = require("express");
const liveExamController = require("../controller/liveExamController");
const { protect } = require("../controller/authController");
const isAdmin = require("../middleware/isAdmin");
const router = express.Router();

router.get("/", protect, liveExamController.getAllLiveEx);
router.post("/create", protect, isAdmin, liveExamController.createLiveEx);
router.get("/upcoming", protect, liveExamController.getUpcomingLiveEx);
router.get("/:id", protect, liveExamController.getLiveExById);
router.put("/:id", protect, isAdmin, liveExamController.updateLiveEx);
router.delete("/:id", protect, isAdmin, liveExamController.deleteLiveEx);
router.post("/:id/add-user", protect, liveExamController.addUser);
module.exports = router;
