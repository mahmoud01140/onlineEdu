const mongoose = require("mongoose");
const LiveExSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  examTime: {
    type: String,
    required: true,
  },
  zoomLink: {
    type: String,
    default: "",
  },
  zoomPassword: {
    type: String,
    default: "",
  },
  examDateTime: {
    type: Date,
    required: true,
  },
  insturctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

const LiveEx = mongoose.model("LiveEx", LiveExSchema);

module.exports = LiveEx;
