const catchAsync = require("../utils/catchAsync");
const Group = require("../models/Group");
const { AppError } = require("../middleware/error");
const Lesson = require("../models/Lesson");
// إنشاء مجموعة جديدة
exports.createGroup = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    level,
    students,
    maxStudents,
    schedule,
    inActive,
  } = req.body;

  // التحقق من الحقول المطلوبة
  if (!title || !description || !level) {
    return next(new AppError("الرجاء توفير العنوان والوصف والمستوى", 400));
  }

  const newGroup = await Group.create({
    title,
    description,
    level,
    maxStudents,
    schedule,
    inActive,
    insturctor: req.user._id,
    students: students || [],
  });

  res.status(201).json({
    status: "success",
    message: "تم إنشاء المجموعة بنجاح",
    data: {
      group: newGroup,
    },
  });
});

// الحصول على جميع المجموعات
exports.getAllGroups = catchAsync(async (req, res, next) => {
  // بناء كائن الاستعلام
  const filter = {};

  // إضافة عوامل التصفية إذا وجدت
  if (req.query.level) {
    filter.level = req.query.level;
  }
  if (req.query.search) {
    filter.title = { $regex: req.query.search, $options: "i" };
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const groups = await Group.find(filter)
    .populate("students", "name email")
    .populate("insturctor", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Group.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: groups.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      groups,
    },
  });
});

// الحصول على مجموعة بواسطة ID
exports.getGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findById(req.params.id)
    .populate("students", "name email")
    .populate("insturctor", "name email");

  if (!group) {
    return next(new AppError("لا توجد مجموعة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      group,
    },
  });
});

// تحديث مجموعة
exports.updateGroup = catchAsync(async (req, res, next) => {
  const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate("students", "name email")
    .populate("insturctor", "name email");

  if (!group) {
    return next(new AppError("لا توجد مجموعة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم تحديث المجموعة بنجاح",
    data: {
      group,
    },
  });
});

// حذف مجموعة
exports.deleteGroup = catchAsync(async (req, res, next) => {
  await Lesson.deleteMany({ group: req.params.id });
  const group = await Group.findByIdAndDelete(req.params.id);
  if (!group) {
    return next(new AppError("لا توجد مجموعة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم حذف المجموعة بنجاح",
    data: null,
  });
});

// إضافة طالب إلى مجموعة
exports.addStudentToGroup = catchAsync(async (req, res, next) => {
  const { studentId } = req.body;

  if (!studentId) {
    return next(new AppError("معرف الطالب مطلوب", 400));
  }

  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { students: studentId } },
    { new: true, runValidators: true }
  ).populate("students", "name email");

  if (!group) {
    return next(new AppError("لا توجد مجموعة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم إضافة الطالب إلى المجموعة بنجاح",
    data: {
      group,
    },
  });
});

// إزالة طالب من مجموعة
exports.removeStudentFromGroup = catchAsync(async (req, res, next) => {
  const { studentId } = req.body;

  if (!studentId) {
    return next(new AppError("معرف الطالب مطلوب", 400));
  }

  const group = await Group.findByIdAndUpdate(
    req.params.id,
    { $pull: { students: studentId } },
    { new: true, runValidators: true }
  ).populate("students", "name email");

  if (!group) {
    return next(new AppError("لا توجد مجموعة بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم إزالة الطالب من المجموعة بنجاح",
    data: {
      group,
    },
  });
});

// الحصول على إحصائيات المجموعات
exports.getGroupStats = catchAsync(async (req, res, next) => {
  const stats = await Group.aggregate([
    {
      $group: {
        _id: "$level",
        totalGroups: { $sum: 1 },
        totalStudents: { $sum: { $size: "$students" } },
        avgStudents: { $avg: { $size: "$students" } },
      },
    },
    {
      $sort: { totalGroups: -1 },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
    },
  });
});

// البحث في المجموعات
exports.searchGroups = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError("كلمة البحث مطلوبة", 400));
  }

  const groups = await Group.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  })
    .populate("students", "name email")
    .populate("insturctor", "name email");

  res.status(200).json({
    status: "success",
    results: groups.length,
    data: {
      groups,
    },
  });
});
