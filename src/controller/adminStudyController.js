// controllers/studyController.js
const Lesson = require("../models/Lesson");
const Group = require("../models/Group");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const catchAsync = require("../utils/catchAsync");

// Get upcoming lessons
exports.getUpcomingLessons = catchAsync(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingLessons = await Lesson.find({
    date: { $gte: today }
  })
    .populate("group", "title level students insturctor")
    // .populate("exam", "title examType")
    .sort({ date: 1 })
    .limit(10);

  res.status(200).json({
    status: "success",
    data: {
      lessons: upcomingLessons
    }
  });
});

// Get group details with students
exports.getGroupDetails = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId)
    .populate("students", "name email phone age level profileImage")
    .populate("insturctor", "name email phone");

  if (!group) {
    return res.status(404).json({
      status: "fail",
      message: "Group not found"
    });
  }

  res.status(200).json({
    status: "success",
    data: {
      group
    }
  });
});

// Mark attendance
exports.markAttendance = catchAsync(async (req, res, next) => {
  const { lessonId, groupId, attendanceRecords } = req.body;

  // Check if lesson exists
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    return res.status(404).json({
      status: "fail",
      message: "Lesson not found"
    });
  }

  // Create or update attendance records
  const attendancePromises = attendanceRecords.map(async (record) => {
    const attendance = await Attendance.findOneAndUpdate(
      {
        lesson: lessonId,
        student: record.studentId,
        group: groupId
      },
      {
        lesson: lessonId,
        student: record.studentId,
        group: groupId,
        status: record.status,
        notes: record.notes || "",
        date: lesson.date
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );
    return attendance;
  });

  await Promise.all(attendancePromises);

  res.status(200).json({
    status: "success",
    message: "Attendance marked successfully",
    data: {
      lessonId,
      groupId,
      recordsCount: attendanceRecords.length
    }
  });
});

// Get attendance records for a lesson
exports.getAttendanceRecords = catchAsync(async (req, res, next) => {
  const { lessonId } = req.params;

  const attendanceRecords = await Attendance.find({ lesson: lessonId })
    .populate("student", "name email")
    .populate("group", "title");

  res.status(200).json({
    status: "success",
    data: {
      attendance: attendanceRecords
    }
  });
});