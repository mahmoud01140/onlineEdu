const LiveExam = require("../models/LiveEx");
const catchAsync = require("../utils/catchAsync");
const { AppError } = require("../middleware/error");
const User = require("../models/User");
exports.getAllLiveEx = catchAsync(async (req, res, next) => {
  const liveExams = await LiveExam.find().sort({ examDateTime: 1 })
  .populate("users", "name email")
  // .populate("insturctor", "name email");

  res.status(200).json({
    status: "success",
    results: liveExams.length,
    data: {
      liveExams,
    },
  });
});
exports.createLiveEx = catchAsync(async (req, res, next) => {
  const { title, description, examDate, examTime, duration, zoomLink, zoomPassword } = req.body;
  
  if (!title || !description || !examDate || !examTime || !duration) {
    return next(new AppError("يرجى ملء جميع الحقول", 400));
  }

  // Create combined datetime
  const examDateTime = new Date(`${examDate.split('T')[0]}T${examTime}`);
  
  const liveExam = await LiveExam.create({
    title,
    description,
    examDate,
    examTime,
    examDateTime, // Store the combined field
    duration,
    zoomLink,
    zoomPassword,
    insturctor: req.user._id
  });

  res.status(201).json({
    status: "success",
    message: "تم إنشاء الامتحان الإلكتروني بنجاح",
    data: {
      liveExam,
    },
  });
});

exports.getUpcomingLiveEx = catchAsync(async (req, res, next) => {
  const liveExams = await LiveExam.find({
    examDateTime: { $gte: new Date() }
  }).sort({ examDateTime: 1 })
  .populate("users", "name email")
  // .populate("insturctor", "name email");

  res.status(200).json({
    status: "success",
    results: liveExams.length,
    data: {
      liveExams,
    },
  });
});

exports.getLiveExById = catchAsync(async (req, res, next) => {
  const liveExam = await LiveExam.findById(req.params.id)
    .populate("users", "name email")
    // .populate("insturctor", "name email");

  if (!liveExam) {
    return next(new AppError("لا توجد امتحان إلكتروني بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      liveExam,
    },
  });
});

exports.updateLiveEx = catchAsync(async (req, res, next) => {
  const { title, description, examDate, examTime, duration, zoomLink, zoomPassword } = req.body;
  
  if (!title || !description || !examDate || !examTime || !duration) {
    return next(new AppError("يرجى ملء جميع الحقول", 400));
  }

  // Create combined datetime
  const examDateTime = new Date(`${examDate.split('T')[0]}T${examTime}`);
  
  const liveExam = await LiveExam.findByIdAndUpdate(req.params.id, {
    title,
    description,
    examDate,
    examTime,
    examDateTime, // Store the combined field
    duration,
    zoomLink,
    zoomPassword,
  }, {
    new: true,
    runValidators: true,
  })
    // .populate("group", "name")
    // .populate("insturctor", "name email");

  if (!liveExam) {
    return next(new AppError("لا توجد امتحان إلكتروني بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم تحديث الامتحان الإلكتروني بنجاح",
    data: {
      liveExam,
    },
  });
});

exports.deleteLiveEx = catchAsync(async (req, res, next) => {
  const liveExam = await LiveExam.findByIdAndDelete(req.params.id);

  if (!liveExam) {
    return next(new AppError("لا توجد امتحان إلكتروني بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم حذف الامتحان الإلكتروني بنجاح",
    data: {
      liveExam,
    },
  });
});

exports.addUser = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const existingUser = await User.findById(userId);
  if (!existingUser) {
    return next(new AppError("المستخدم غير موجود", 404));
  }

  const liveExam = await LiveExam.findById(req.params.id);
  if (!liveExam) {
    return next(new AppError("الامتحان غير موجود", 404));
  }

  const isUserInExam = liveExam.users.includes(userId);
  if (isUserInExam) {
    return next(new AppError("المستخدم موجود بالفعل في الامتحان", 400));
  }

  // ✅ Fix: add { new: true } to get the updated document
  const updatedLiveExam = await LiveExam.findByIdAndUpdate(
    req.params.id,
    { $push: { users: userId } },
    { new: true } // <-- this ensures you get the updated document
  ).populate("users", "name email");

  res.status(200).json({
    status: "success",
    message: "تم إضافة المستخدم بنجاح",
    data: {
      updatedLiveExam,
    },
  });
});
