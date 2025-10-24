const catchAsync = require("../utils/catchAsync");
const User = require("../models/User"); // Single User model
const Group = require("../models/Group");
const { AppError } = require("../middleware/error");

// وظيفة مساعدة لتصفية الحقول المسموح بتحديثها
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// الحصول على جميع المستخدمين مع التصفية المتقدمة
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const {
    role,
    level,
    isActive,
    isPassLiveEx,
    search,
    page = 1,
    limit = 10,
    sort = "-createdAt",
  } = req.query;

  // بناء كائن الاستعلام
  const filter = {};

  // إضافة عوامل التصفية إذا وجدت
  if (role) filter.role = role;
  if (level) filter.level = level;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isPassLiveEx !== undefined) filter.isPassLiveEx = isPassLiveEx === "true";
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const users = await User.find(filter)
    .select("-password")
    .populate({
      path: "groups",
      select: "title level schedule",
      populate: {
        path: "students",
        select: "name email",
      },
    })
    .populate("exams.exam")
    .populate("courses", "title category duration")
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      users,
    },
  });
});

// الحصول على مستخدم بواسطة ID مع جميع المعلومات
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate({
      path: "groups",
      select: "title level schedule students",
      populate: {
        path: "students",
        select: "name email",
      },
    })
    .populate("courses", "title category duration");

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      user: {
        ...user.toObject(),
      },
    },
  });
});

// إنشاء مستخدم جديد
exports.createUser = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    role = "student",
    phone,
    age,
    address,
    parentPhone,
    parentJob,
    schoolType,
    grade,
    memorizedAmount,
    level,
    isActive,
    // حقول خاصة بالمعلم
    specialization,
    experience,
    qualifications,
    // حقول خاصة بالمشرف
    permissions,
    department,
    // حقول شخصية ودينية مشتركة
    maritalStatus,
    children,
    hasChildren,
    hasSiblings,
    praysFive,
    keepsAdhkar,
    fastsMondayThursday,
    // حقول الدراسة
    studiedFath,
    studiedTuhfa,
    studiedNoor,
    studiedTajweed,
    studiedSharia,
    // حقول إضافية
    education,
    hasIjaza,
    tookIqraCourse,
    workedInTahfeez,
    workedInNurseries,
    profession,
    // خطط وجداول
    availableTime,
    dailyMemorization,
    dailyReview,
    dailyRecitation,
    khatmaPlan,
    planFinishQuran,
    // مهارات ومواهب
    computerSkills,
    talents,
    intentions,
    preservationPlans,
    preservationFruits,
    // موافقات وعائلية
    husbandApproves,
    husbandPrays,
    parentsMemorize,
    parentMemorize,
    attendNoorCourse,
    canUseTelegramZoom,
  } = req.body;

  // التحقق من الحقول المطلوبة
  if (!name || !email || !password) {
    return next(
      new AppError("الاسم والبريد الإلكتروني وكلمة المرور مطلوبة", 400)
    );
  }

  // التحقق من صحة الدور
  if (!["student", "teacher", "elder", "admin"].includes(role)) {
    return next(
      new AppError("الدور يجب أن يكون: student، teacher، elder، أو admin", 400)
    );
  }

  // التحقق من عدم وجود مستخدم بنفس البريد الإلكتروني
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError("هذا البريد الإلكتروني مسجل بالفعل", 400));
  }

  const userData = {
    name,
    email: email.toLowerCase(),
    password,
    role,
    phone,
    age,
    address,
    level: level || (role === "student" ? "مبتدئ" : ""),
    isActive: isActive !== undefined ? isActive : true,
    // حقول مشتركة
    maritalStatus,
    children,
    hasChildren,
    hasSiblings,
    praysFive,
    keepsAdhkar,
    fastsMondayThursday,
    studiedFath,
    studiedTuhfa,
    studiedNoor,
    studiedTajweed,
    studiedSharia,
    availableTime,
    dailyMemorization,
    dailyReview,
    dailyRecitation,
    memorizedAmount,
    talents,
    canUseTelegramZoom,
    // حقول حسب الدور
    ...(role === "student" && {
      parentPhone,
      parentJob,
      schoolType,
      grade,
      planFinishQuran,
      parentsMemorize,
      parentMemorize,
      attendNoorCourse,
      dailyMemorize: dailyMemorization,
    }),
    ...(role === "teacher" && {
      education,
      specialization,
      experience,
      qualifications,
      hasIjaza,
      tookIqraCourse,
      workedInTahfeez,
      workedInNurseries,
      husbandApproves,
      husbandPrays,
      intentions,
      preservationPlans,
      preservationFruits,
      khatmaPlan,
      computerSkills,
    }),
    ...(role === "elder" && {
      profession,
      permissions,
      department,
    }),
    ...(role === "admin" && {
      permissions,
      department,
    }),
  };

  const newUser = await User.create(userData);

  // إرجاع البيانات بدون كلمة المرور
  const userResponse = await User.findById(newUser._id)
    .select("-password")
    .populate("groups", "title level");

  res.status(201).json({
    status: "success",
    message: `تم إنشاء ${getRoleArabicName(role)} بنجاح`,
    data: {
      user: userResponse,
    },
  });
});

// تحديث مستخدم
exports.updateUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // الحقول المسموح بها بناءً على الدور الحالي للمستخدم
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  const commonFields = [
    "name",
    "email",
    "phone",
    "age",
    "address",
    "level",
    "isActive",
    "maritalStatus",
    "children",
    "hasChildren",
    "hasSiblings",
    "praysFive",
    "keepsAdhkar",
    "fastsMondayThursday",
    "studiedFath",
    "studiedTuhfa",
    "studiedNoor",
    "studiedTajweed",
    "studiedSharia",
    "availableTime",
    "dailyMemorization",
    "dailyReview",
    "dailyRecitation",
    "memorizedAmount",
    "talents",
    "canUseTelegramZoom",
  ];

  const studentFields = [
    "parentPhone",
    "parentJob",
    "schoolType",
    "grade",
    "planFinishQuran",
    "parentsMemorize",
    "parentMemorize",
    "attendNoorCourse",
  ];

  const teacherFields = [
    "education",
    "specialization",
    "experience",
    "qualifications",
    "hasIjaza",
    "tookIqraCourse",
    "workedInTahfeez",
    "workedInNurseries",
    "husbandApproves",
    "husbandPrays",
    "intentions",
    "preservationPlans",
    "preservationFruits",
    "khatmaPlan",
    "computerSkills",
  ];

  const elderFields = ["profession", "permissions", "department"];
  const adminFields = ["permissions", "department"];

  let allowedFields = [...commonFields];

  if (user.role === "student")
    allowedFields = [...allowedFields, ...studentFields];
  else if (user.role === "teacher")
    allowedFields = [...allowedFields, ...teacherFields];
  else if (user.role === "elder")
    allowedFields = [...allowedFields, ...elderFields];
  else if (user.role === "admin")
    allowedFields = [...allowedFields, ...adminFields];

  const filteredBody = filterObj(req.body, ...allowedFields);

  // إذا حاول المستخدم تحديث البريد الإلكتروني، التحقق من عدم تكراره
  if (filteredBody.email) {
    const existingUser = await User.findOne({
      email: filteredBody.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existingUser) {
      return next(new AppError("هذا البريد الإلكتروني مسجل بالفعل", 400));
    }
    filteredBody.email = filteredBody.email.toLowerCase();
  }

  const updatedUser = await User.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .select("-password")
    .populate("groups", "title level")
    .populate("courses", "title category");

  res.status(200).json({
    status: "success",
    message: "تم تحديث المستخدم بنجاح",
    data: {
      user: updatedUser,
    },
  });
});

// تحديث مستوى المستخدم
exports.updateUserLevel = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { level } = req.body;

  if (!level || !["مبتدئ", "متوسط", "متقدم"].includes(level)) {
    return next(
      new AppError("المستوى يجب أن يكون: مبتدئ، متوسط، أو متقدم", 400)
    );
  }

  const user = await User.findByIdAndUpdate(
    id,
    { level },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم تحديث مستوى المستخدم بنجاح",
    data: {
      user,
    },
  });
});

// تحديث دور المستخدم (أبسط الآن مع النموذج الموحد)
exports.updateUserRole = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["student", "teacher", "elder", "admin"].includes(role)) {
    return next(
      new AppError("الدور يجب أن يكون: student، teacher، elder، أو admin", 400)
    );
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  // إذا كان الدور الجديد هو نفسه الحالي، لا داعي للتحديث
  if (user.role === role) {
    return next(new AppError("المستخدم لديه هذا الدور بالفعل", 400));
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    {
      new: true,
      runValidators: true,
    }
  ).select("-password");

  res.status(200).json({
    status: "success",
    message: `تم تحديث دور المستخدم إلى ${getRoleArabicName(role)} بنجاح`,
    data: {
      user: updatedUser,
    },
  });
});

// حذف مستخدم
exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  // إزالة المستخدم من جميع المجموعات
  await Group.updateMany(
    { students: req.params.id },
    { $pull: { students: req.params.id } }
  );

  res.status(200).json({
    status: "success",
    message: "تم حذف المستخدم بنجاح",
    data: null,
  });
});

// تعطيل/تفعيل مستخدم
exports.toggleUserStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  user.isActive = !user.isActive;
  await user.save();

  const userResponse = await User.findById(req.params.id)
    .select("-password")
    .populate("groups", "title level");

  res.status(200).json({
    status: "success",
    message: user.isActive ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم",
    data: {
      user: userResponse,
    },
  });
});

// إضافة مستخدم إلى مجموعة
exports.addUserToGroup = catchAsync(async (req, res, next) => {
  const { groupId } = req.body;

  if (!groupId) {
    return next(new AppError("معرف المجموعة مطلوب", 400));
  }

  // التحقق من وجود المجموعة
  const group = await Group.findById(groupId);
  if (!group) {
    return next(new AppError("المجموعة غير موجودة", 404));
  }

  // التحقق من وجود المستخدم
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  // التحقق من أن المستخدم ليس في المجموعة بالفعل
  if (group.students.includes(req.params.id)) {
    return next(new AppError("المستخدم موجود بالفعل في هذه المجموعة", 400));
  }

  // إضافة المستخدم إلى المجموعة
  await Group.findByIdAndUpdate(groupId, {
    $addToSet: { students: req.params.id },
  });

  // إضافة المجموعة إلى المستخدم
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { groups: groupId } },
    { new: true, runValidators: true }
  )
    .select("-password")
    .populate("groups", "title level schedule");

  res.status(200).json({
    status: "success",
    message: "تم إضافة المستخدم إلى المجموعة بنجاح",
    data: {
      user: updatedUser,
    },
  });
});

// إزالة مستخدم من مجموعة
exports.removeUserFromGroup = catchAsync(async (req, res, next) => {
  const { groupId } = req.body;

  if (!groupId) {
    return next(new AppError("معرف المجموعة مطلوب", 400));
  }

  // إزالة المستخدم من المجموعة
  await Group.findByIdAndUpdate(groupId, {
    $pull: { students: req.params.id },
  });

  // إزالة المجموعة من المستخدم
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $pull: { groups: groupId } },
    { new: true, runValidators: true }
  )
    .select("-password")
    .populate("groups", "title level schedule");

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    message: "تم إزالة المستخدم من المجموعة بنجاح",
    data: {
      user,
    },
  });
});

// الحصول على إحصائيات المستخدمين
exports.getUserStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    {
      $group: {
        _id: "$role",
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
        avgAge: { $avg: "$age" },
      },
    },
    {
      $sort: { totalUsers: -1 },
    },
  ]);

  const levelStats = await User.aggregate([
    {
      $group: {
        _id: "$level",
        count: { $sum: 1 },
      },
    },
  ]);

  const groupStats = await Group.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "students",
        foreignField: "_id",
        as: "groupStudents",
      },
    },
    {
      $group: {
        _id: "$level",
        totalGroups: { $sum: 1 },
        totalStudents: { $sum: { $size: "$groupStudents" } },
        avgStudentsPerGroup: { $avg: { $size: "$groupStudents" } },
      },
    },
  ]);

  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });
  const todayRegistrations = await User.countDocuments({
    createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
  });

  res.status(200).json({
    status: "success",
    data: {
      roleStats: stats,
      levelStats,
      groupStats,
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      todayRegistrations,
    },
  });
});

// البحث في المستخدمين
exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query || query.length < 2) {
    return next(new AppError("كلمة البحث يجب أن تكون على الأقل حرفين", 400));
  }

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { email: { $regex: query, $options: "i" } },
      { phone: { $regex: query, $options: "i" } },
    ],
  })
    .select("-password")
    .populate("groups", "title level")
    .limit(20)
    .sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

// الحصول على مجموعات المستخدم
exports.getUserGroups = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate({
    path: "groups",
    select: "title level schedule students",
    populate: {
      path: "students",
      select: "name email",
    },
  });

  if (!user) {
    return next(new AppError("لا يوجد مستخدم بهذا المعرف", 404));
  }

  res.status(200).json({
    status: "success",
    results: user.groups.length,
    data: {
      groups: user.groups,
    },
  });
});




// الحصول على المستخدمين بدون مجموعات
exports.getUsersWithoutGroups = catchAsync(async (req, res, next) => {
  const users = await User.find({
    groups: { $size: 0 },
    role: "student",
    isActive: true,
  })
    .select("name email phone level")
    .sort({ name: 1 });

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

// تصدير بيانات المستخدمين
exports.exportUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({})
    .select("-password")
    .populate("groups", "title level")
    .sort({ createdAt: -1 });

  // تنسيق البيانات للتصدير
  const exportData = users.map((user) => ({
    الاسم: user.name,
    البريد_الإلكتروني: user.email,
    الهاتف: user.phone || "",
    الدور: getRoleArabicName(user.role),
    المستوى: user.level || "",
    الحالة: user.isActive ? "نشط" : "غير نشط",
    المجموعات: user.groups.map((g) => g.title).join("، ") || "لا يوجد",
    تاريخ_التسجيل: user.createdAt.toLocaleDateString("ar-SA"),
    // حقول إضافية حسب الدور
    ...(user.role === "student" && {
      المدرسة: user.schoolType || "",
      الصف: user.grade || "",
      الحفظ: user.memorizedAmount || "0",
    }),
    ...(user.role === "teacher" && {
      التخصص: user.specialization || "",
      الخبرة: user.experience || "0",
    }),
    ...(user.role === "elder" && {
      القسم: user.department || "",
      المهنة: user.profession || "",
    }),
  }));

  res.status(200).json({
    status: "success",
    results: exportData.length,
    data: {
      users: exportData,
    },
  });
});

// الحصول على المعلمين فقط
exports.getTeachers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, specialization } = req.query;
  const skip = (page - 1) * limit;

  const filter = { role: "teacher", isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (specialization) {
    filter.specialization = { $regex: specialization, $options: "i" };
  }

  const teachers = await User.find(filter)
    .select("-password")
    .populate("groups", "title level schedule")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: teachers.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      teachers,
    },
  });
});

// الحصول على الطلاب فقط
exports.getStudents = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, level, grade } = req.query;
  const skip = (page - 1) * limit;

  const filter = { role: "student", isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (level) filter.level = level;
  if (grade) filter.grade = grade;

  const students = await User.find(filter)
    .select("-password")
    .populate("groups", "title level schedule")
    .populate("courses", "title category")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: students.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      students,
    },
  });
});

// الحصول على المشرفين فقط
exports.getElders = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, search, department } = req.query;
  const skip = (page - 1) * limit;

  const filter = { role: "elder", isActive: true };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (department) {
    filter.department = { $regex: department, $options: "i" };
  }

  const elders = await User.find(filter)
    .select("-password")
    .populate("groups", "title level")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: elders.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      elders,
    },
  });
});

// وظيفة مساعدة للحصول على الاسم العربي للدور
function getRoleArabicName(role) {
  const roles = {
    student: "طالب",
    teacher: "معلم",
    elder: "مشرف",
    admin: "مدير",
  };
  return roles[role] || role;
}
