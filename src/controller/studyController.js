const catchAsync = require("../utils/catchAsync");
const Lesson = require("../models/Lesson");
const Group = require("../models/Group");
const { AppError } = require("../middleware/error");

// الحصول على جميع الدروس
exports.getUserLessons = catchAsync(async (req, res, next) => {
  const groupId = req.user.groups[0];
  console.log(groupId);

  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError("لم يتم اضافتك الى احد المجموعات حتى الان", 404));
  }
  const lessons = await Lesson.find({ group: groupId })
    .populate("group", "title level schedule students maxStudents")
    .sort({ date: -1 });
  const total = await Lesson.countDocuments({ group: groupId });
  res.status(200).json({
    status: "success",
    results: lessons.length,
    total,
    data: {
      lessons,
    },
  });
});
