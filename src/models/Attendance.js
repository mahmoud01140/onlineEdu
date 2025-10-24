// models/Attendance.js
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true
  },
  status: {
    type: String,
    enum: ["present", "absent", "late", "excused"],
    default: "absent",
    required: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  date: {
    type: Date,
    required: true
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance records
attendanceSchema.index({ lesson: 1, student: 1 }, { unique: true });

// Virtual for formatted date
attendanceSchema.virtual("formattedDate").get(function() {
  return this.date.toLocaleDateString("ar-SA");
});

// Static method to get attendance summary
attendanceSchema.statics.getAttendanceSummary = async function(groupId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        group: mongoose.Types.ObjectId(groupId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
};

const Attendance = mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;