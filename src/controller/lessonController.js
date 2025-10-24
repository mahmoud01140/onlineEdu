const catchAsync = require("../utils/catchAsync");
const Lesson = require("../models/Lesson");
const Group = require("../models/Group");
const Exam = require("../models/Exam");
const { AppError } = require("../middleware/error");

// إنشاء درس جديد
exports.createLesson = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    group: groupId,
    date,
    resources,
    zoomLink,
    zoomPassword,
  } = req.body;
  console.log(req.body);
  // التحقق من الحقول المطلوبة
  if (!title || !description || !groupId ) {
    return next(new AppError("العنوان والوصف والمجموعة مطلوبة", 400));
  }

  // التحقق من وجود المجموعة
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError("المجموعة غير موجودة", 404));
  }

  // التحقق من أن المستخدم لديه صلاحية إضافة درس لهذه المجموعة
  // (يمكن إضافة منطق التحقق بالصلاحيات هنا)

  const newLesson = await Lesson.create({
    title,
    description,
    group: groupId,
    date: date || new Date(),
    resources: resources || [],
    zoomLink,
    zoomPassword,
  });

  // تعبئة بيانات المجموعة في الاستجابة
  await newLesson.populate({
      path: 'group',
      select: 'title level students schedule',
      populate : {
        path : "insturctor",
        select : "name email phone"
      }
    });

  res.status(201).json({
    status: "success",
    message: "تم إنشاء الدرس بنجاح",
    data: {
      lesson: newLesson,
    },
  });
});

// الحصول على جميع الدروس
exports.getAllLessons = catchAsync(async (req, res, next) => {
  // بناء كائن الاستعلام
  const filter = {};

  // إضافة عوامل التصفية إذا وجدت
  if (req.query.group) {
    filter.group = req.query.group;
  }
  if (req.query.dateFrom) {
    filter.date = { ...filter.date, $gte: new Date(req.query.dateFrom) };
  }
  if (req.query.dateTo) {
    filter.date = { ...filter.date, $lte: new Date(req.query.dateTo) };
  }
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { description: { $regex: req.query.search, $options: "i" } },
    ];
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const lessons = await Lesson.find(filter)
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lesson.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: lessons.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      lessons,
    },
  });
});

// الحصول على درس بواسطة ID
exports.getLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findById(req.params.id).populate(
    "group",
    "title level students schedule"
  );

  if (!lesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      lesson,
    },
  });
});

// الحصول على دروس مجموعة محددة
exports.getGroupLessons = catchAsync(async (req, res, next) => {
  const { groupId } = req.params;

  // التحقق من وجود المجموعة
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError("المجموعة غير موجودة", 404));
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const lessons = await Lesson.find({ group: groupId })
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lesson.countDocuments({ group: groupId });

  res.status(200).json({
    status: "success",
    results: lessons.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      lessons,
    },
  });
});

// تحديث درس
exports.updateLesson = catchAsync(async (req, res, next) => {
  const { title, description, date, resources, zoomLink, zoomPassword } =
    req.body;
  console.log(resources);
  const lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      date,
      resources,
      zoomLink,
      zoomPassword,
    },
    {
      new: true,
      runValidators: true,
    }
  ).populate("group", "title level students");

  if (!lesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم تحديث الدرس بنجاح",
    data: {
      lesson,
    },
  });
});

// حذف درس
exports.deleteLesson = catchAsync(async (req, res, next) => {
  const lesson = await Lesson.findByIdAndDelete(req.params.id);
  // حذف الامتحانات المرتبطة بالدرس
  await Exam.deleteMany({ lesson: lesson._id });

  if (!lesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم حذف الدرس بنجاح",
    data: null,
  });
});

// إضافة مورد إلى درس
exports.addResource = catchAsync(async (req, res, next) => {
  const { resourceUrl } = req.body;

  if (!resourceUrl) {
    return next(new AppError("رابط المورد مطلوب", 400));
  }

  const lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    { $push: { resources: resourceUrl } },
    { new: true, runValidators: true }
  ).populate("group", "title level");

  if (!lesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم إضافة المورد إلى الدرس بنجاح",
    data: {
      lesson,
    },
  });
});

// إزالة مورد من درس
exports.removeResource = catchAsync(async (req, res, next) => {
  const { resourceUrl } = req.body;

  if (!resourceUrl) {
    return next(new AppError("رابط المورد مطلوب", 400));
  }

  const lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    { $pull: { resources: resourceUrl } },
    { new: true }
  ).populate("group", "title level");

  if (!lesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم إزالة المورد من الدرس بنجاح",
    data: {
      lesson,
    },
  });
});

// الحصول على الدروس القادمة
exports.getUpcomingLessons = catchAsync(async (req, res, next) => {
  const now = new Date();

  const lessons = await Lesson.find({
    date: { $gte: now },
  })
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: 1 })
    .limit(10);

  res.status(200).json({
    status: "success",
    results: lessons.length,
    data: {
      lessons,
    },
  });
});

// الحصول على الدروس السابقة
exports.getPastLessons = catchAsync(async (req, res, next) => {
  const now = new Date();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const lessons = await Lesson.find({
    date: { $lt: now },
  })
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lesson.countDocuments({ date: { $lt: now } });

  res.status(200).json({
    status: "success",
    results: lessons.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: {
      lessons,
    },
  });
});

// الحصول على دروس اليوم
exports.getTodayLessons = catchAsync(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lessons = await Lesson.find({
    date: {
      $gte: today,
      $lt: tomorrow,
    },
  })
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: 1 });

  res.status(200).json({
    status: "success",
    results: lessons.length,
    data: {
      lessons,
    },
  });
});

// البحث في الدروس
exports.searchLessons = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError("كلمة البحث مطلوبة", 400));
  }

  const lessons = await Lesson.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ],
  })
    .populate({
      path: "group",
      select: "title level students schedule",
      populate: {
        path: "insturctor",
        select: "name email phone",
      },
    })
    .sort({ date: -1 })
    .limit(20);

  res.status(200).json({
    status: "success",
    results: lessons.length,
    data: {
      lessons,
    },
  });
});

// الحصول على إحصائيات الدروس
exports.getLessonStats = catchAsync(async (req, res, next) => {
  const stats = await Lesson.aggregate([
    {
      $lookup: {
        from: "groups",
        localField: "group",
        foreignField: "_id",
        as: "groupInfo",
      },
    },
    {
      $unwind: "$groupInfo",
    },
    {
      $group: {
        _id: "$groupInfo.level",
        totalLessons: { $sum: 1 },
        avgResources: { $avg: { $size: "$resources" } },
        upcomingLessons: {
          $sum: {
            $cond: [{ $gte: ["$date", new Date()] }, 1, 0],
          },
        },
      },
    },
    {
      $sort: { totalLessons: -1 },
    },
  ]);

  const totalLessons = await Lesson.countDocuments();
  const upcomingLessons = await Lesson.countDocuments({
    date: { $gte: new Date() },
  });
  const pastLessons = totalLessons - upcomingLessons;

  res.status(200).json({
    status: "success",
    data: {
      levelStats: stats,
      totalLessons,
      upcomingLessons,
      pastLessons,
    },
  });
});

// نسخ درس (لإنشاء درس جديد بناءً على درس موجود)
exports.duplicateLesson = catchAsync(async (req, res, next) => {
  const originalLesson = await Lesson.findById(req.params.id);

  if (!originalLesson) {
    return next(new AppError("لا يوجد درس بهذا المعرف", 404));
  }

  const newLesson = await Lesson.create({
    title: `${originalLesson.title} (نسخة)`,
    description: originalLesson.description,
    group: originalLesson.group,
    date: new Date(), // تاريخ جديد
    resources: [...originalLesson.resources],
  });

  await newLesson.populate("group", "title level");

  res.status(201).json({
    status: "success",
    message: "تم نسخ الدرس بنجاح",
    data: {
      lesson: newLesson,
    },
  });
});
