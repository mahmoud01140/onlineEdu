const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { AppError } = require("../middleware/error");
const catchAsync = require("../utils/catchAsync");

const admin = require("firebase-admin");
const User = require("../models/User"); // Single User model
const validator = require("validator");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

// Common validation function
const validateUserData = (reqBody, role) => {
  const errors = [];
  const {
    name,
    password,
    email,
    age,
    phone,
    address,
    parentPhone,
    // Student specific
    schoolType,
    grade,
    parentJob,
    // Teacher specific
    education,
    children,
    specialization,
    experience,
    // Elder specific
    profession,
    department,
  } = reqBody;

  // Basic validations for all roles
  if (!name || !validator.isLength(name, { min: 2, max: 100 })) {
    errors.push("Name must be between 2 and 100 characters");
  }

  if (!password || !validator.isLength(password, { min: 6 })) {
    errors.push("Password must be at least 6 characters long");
  }

  if (email && !validator.isEmail(email)) {
    errors.push("Email must be valid");
  }

  if (age !== undefined && age !== null && age !== "") {
    if (!validator.isInt(age.toString(), { min: 0, max: 120 })) {
      errors.push("Age must be a valid number between 0 and 120");
    }
  }

  // Role-specific validations
  if (role === "student") {
    if (!parentPhone || !validator.isMobilePhone(parentPhone, "any")) {
      errors.push("Parent phone number must be valid");
    }

    const studentRequiredFields = [
      "grade",
      "parentJob",
      "address",
      "availableTime",
      "memorizedAmount",
      "dailyMemorization",
      "dailyReview",
      "dailyRecitation",
      "planFinishQuran",
    ];

    studentRequiredFields.forEach((field) => {
      if (
        !reqBody[field] ||
        !validator.isLength(reqBody[field].toString(), { min: 1 })
      ) {
        errors.push(
          `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
        );
      }
    });
  }

  if (role === "teacher") {
    const teacherRequiredFields = [
      "availableTime",
      "memorizedAmount",
      "dailyMemorization",
      "dailyReview",
      "dailyRecitation",
      "khatmaPlan",
    ];

    teacherRequiredFields.forEach((field) => {
      if (
        !reqBody[field] ||
        !validator.isLength(reqBody[field].toString(), { min: 1 })
      ) {
        errors.push(
          `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
        );
      }
    });

    if (children !== undefined && children !== null && children !== "") {
      if (!validator.isInt(children.toString(), { min: 0 })) {
        errors.push("Children must be a non-negative integer");
      }
    }
  }

  if (role === "elder") {
    if (!phone || !validator.isMobilePhone(String(phone), "any")) {
      errors.push("Phone must be a valid mobile number");
    }

    if (!address || !validator.isLength(address, { min: 5, max: 500 })) {
      errors.push("Address must be between 5 and 500 characters");
    }

    const elderRequiredFields = [
      "availableTime",
      "memorizedAmount",
      "dailyMemorization",
      "dailyReview",
      "dailyRecitation",
    ];

    elderRequiredFields.forEach((field) => {
      if (
        !reqBody[field] ||
        !validator.isLength(reqBody[field].toString(), { min: 1 })
      ) {
        errors.push(
          `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
        );
      }
    });
  }

  return errors;
};

// Common user creation function
const createUser = async (reqBody, role) => {
  const {
    name,
    email,
    password,
    age,
    phone,
    address,
    // Student fields
    parentPhone,
    parentJob,
    schoolType,
    grade,
    hasSiblings,
    parentsMemorize,
    studiedFath,
    studiedTuhfa,
    studiedNoor,
    prayerFive,
    adhkar,
    canUseTelegramZoom,
    dailyMemorize,
    dailyReview,
    dailyRecitation,
    attendNoorCourse,
    parentMemorize,
    planFinishQuran,
    talents,
    // Teacher fields
    maritalStatus,
    education,
    children,
    hasIjaza,
    tookIqraCourse,
    taughtTuhfa,
    workedInTahfeez,
    workedInNurseries,
    praysFive,
    keepsAdhkar,
    fastsMondayThursday,
    husbandApproves,
    husbandPrays,
    studiedSharia,
    intentions,
    preservationPlans,
    preservationFruits,
    dailyMemorization,
    khatmaPlan,
    computerSkills,
    specialization,
    experience,
    qualifications,
    // Elder fields
    profession,
    hasChildren,
    studiedTajweed,
    studiedFath: elderStudiedFath,
    studiedTuhfat,
    prayFive: elderPrayFive,
    adhkar: elderAdhkar,
    department,
    permissions,
  } = reqBody;

  const userData = {
    name: validator.escape(name).trim(),
    email: email ? validator.escape(email).trim().toLowerCase() : undefined,
    password,
    role,
    age:
      age !== undefined && age !== null && age !== ""
        ? parseInt(age, 10)
        : undefined,
    phone: phone ? validator.escape(phone).trim() : undefined,
    address: address ? validator.escape(address).trim() : undefined,
    // Common fields
    availableTime: reqBody.availableTime
      ? validator.escape(reqBody.availableTime).trim()
      : undefined,
    memorizedAmount: reqBody.memorizedAmount
      ? validator.escape(reqBody.memorizedAmount).trim()
      : undefined,
    dailyMemorization: reqBody.dailyMemorization
      ? validator.escape(reqBody.dailyMemorization).trim()
      : undefined,
    dailyReview: reqBody.dailyReview
      ? validator.escape(reqBody.dailyReview).trim()
      : undefined,
    dailyRecitation: reqBody.dailyRecitation
      ? validator.escape(reqBody.dailyRecitation).trim()
      : undefined,
    talents: talents ? validator.escape(talents).trim() : undefined,
    canUseTelegramZoom: canUseTelegramZoom || "no",
    // Personal fields
    maritalStatus,
    children:
      children !== undefined && children !== null && children !== ""
        ? parseInt(children, 10)
        : 0,
    hasChildren: hasChildren || "no",
    hasSiblings: hasSiblings || "no",
    // Religious practices
    praysFive: praysFive || "no",
    keepsAdhkar: keepsAdhkar || "no",
    fastsMondayThursday: fastsMondayThursday || "no",
    prayerFive: prayerFive || "no",
    adhkar: adhkar || "no",
    // Study fields
    studiedFath: studiedFath || "no",
    studiedTuhfa: studiedTuhfa || "no",
    studiedNoor: studiedNoor || "no",
    studiedTajweed: studiedTajweed || "no",
    studiedSharia: studiedSharia
      ? validator.escape(studiedSharia).trim()
      : undefined,
    // Role-specific fields
    ...(role === "student" && {
      parentPhone: parentPhone
        ? validator.escape(parentPhone).trim()
        : undefined,
      parentJob: parentJob ? validator.escape(parentJob).trim() : undefined,
      schoolType,
      grade: grade ? validator.escape(grade).trim() : undefined,
      parentsMemorize: parentsMemorize || "no",
      parentMemorize: parentMemorize || "no",
      attendNoorCourse: attendNoorCourse || "no",
      dailyMemorize: dailyMemorize
        ? validator.escape(dailyMemorize).trim()
        : undefined,
      planFinishQuran: planFinishQuran
        ? validator.escape(planFinishQuran).trim()
        : undefined,
    }),
    ...(role === "teacher" && {
      education: education ? validator.escape(education).trim() : undefined,
      hasIjaza: hasIjaza || "no",
      tookIqraCourse: tookIqraCourse || "no",
      taughtTuhfa: taughtTuhfa || "no",
      workedInTahfeez: workedInTahfeez || "no",
      workedInNurseries: workedInNurseries || "no",
      husbandApproves: husbandApproves || "no",
      husbandPrays: husbandPrays || "no",
      intentions: intentions ? validator.escape(intentions).trim() : undefined,
      preservationPlans: preservationPlans
        ? validator.escape(preservationPlans).trim()
        : undefined,
      preservationFruits: preservationFruits
        ? validator.escape(preservationFruits).trim()
        : undefined,
      khatmaPlan: khatmaPlan ? validator.escape(khatmaPlan).trim() : undefined,
      computerSkills: computerSkills
        ? validator.escape(computerSkills).trim()
        : undefined,
      specialization: specialization
        ? validator.escape(specialization).trim()
        : undefined,
      experience: experience !== undefined ? parseInt(experience, 10) : 0,
      qualifications: qualifications
        ? validator.escape(qualifications).trim()
        : undefined,
    }),
    ...(role === "elder" && {
      profession: profession ? validator.escape(profession).trim() : undefined,
      studiedFath: elderStudiedFath || "no",
      studiedTuhfat: studiedTuhfat || "no",
      prayFive: elderPrayFive || "no",
      adhkar: elderAdhkar || "no",
      department: department ? validator.escape(department).trim() : undefined,
      permissions: permissions || [],
    }),
    ...(role === "admin" && {
      department: department ? validator.escape(department).trim() : undefined,
      permissions: permissions || [],
    }),
  };

  return await User.create(userData);
};

exports.signupStudent = catchAsync(async (req, res, next) => {
  const errors = validateUserData(req.body, "student");

  // Student-specific enum validations
  const enumFields = {
    schoolType: ["عام", "أهلي", "ازهر", "أخرى"],
    hasSiblings: ["yes", "no"],
    parentsMemorize: ["yes", "no"],
    studiedFath: ["yes", "no"],
    studiedTuhfa: ["yes", "no"],
    studiedNoor: ["yes", "no"],
    prayerFive: ["yes", "no"],
    adhkar: ["yes", "no"],
    canUseTelegramZoom: ["yes", "no"],
    attendNoorCourse: ["yes", "no"],
    parentMemorize: ["yes", "no"],
  };

  Object.keys(enumFields).forEach((field) => {
    if (req.body[field] && !enumFields[field].includes(req.body[field])) {
      errors.push(`${field} must be one of: ${enumFields[field].join(", ")}`);
    }
  });

  // Address length validation
  if (
    req.body.address &&
    !validator.isLength(req.body.address, { min: 10, max: 500 })
  ) {
    errors.push("Address must be between 10 and 500 characters");
  }

  // Talents length validation
  if (
    req.body.talents &&
    !validator.isLength(req.body.talents, { max: 1000 })
  ) {
    errors.push("Talents cannot exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  const newStudent = await createUser(req.body, "student");
  createSendToken(newStudent, 201, res);
});

exports.signupTeacher = catchAsync(async (req, res, next) => {
  const errors = validateUserData(req.body, "teacher");

  // Teacher-specific validations
  const yesNoFields = [
    "hasIjaza",
    "tookIqraCourse",
    "studiedTuhfa",
    "taughtTuhfa",
    "workedInTahfeez",
    "workedInNurseries",
    "praysFive",
    "keepsAdhkar",
    "fastsMondayThursday",
    "husbandApproves",
    "husbandPrays",
    "canUseTelegramZoom",
  ];

  yesNoFields.forEach((field) => {
    if (req.body[field] && !["yes", "no"].includes(req.body[field])) {
      errors.push(`${field} must be one of: yes, no`);
    }
  });

  // Length checks for optional long fields
  if (
    req.body.preservationPlans &&
    !validator.isLength(req.body.preservationPlans, { max: 1000 })
  ) {
    errors.push("preservationPlans cannot exceed 1000 characters");
  }
  if (
    req.body.preservationFruits &&
    !validator.isLength(req.body.preservationFruits, { max: 1000 })
  ) {
    errors.push("preservationFruits cannot exceed 1000 characters");
  }
  if (
    req.body.talents &&
    !validator.isLength(req.body.talents, { max: 1000 })
  ) {
    errors.push("talents cannot exceed 1000 characters");
  }
  if (
    req.body.intentions &&
    !validator.isLength(req.body.intentions, { max: 2000 })
  ) {
    errors.push("intentions cannot exceed 2000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  const newTeacher = await createUser(req.body, "teacher");
  createSendToken(newTeacher, 201, res);
});

exports.signupElder = catchAsync(async (req, res, next) => {
  const errors = validateUserData(req.body, "elder");

  // Elder-specific validations
  const yesNoFields = [
    "hasChildren",
    "studiedTajweed",
    "studiedFath",
    "studiedTuhfat",
    "prayFive",
    "adhkar",
    "canUseTelegramZoom",
  ];

  yesNoFields.forEach((field) => {
    if (req.body[field] && !["yes", "no"].includes(req.body[field])) {
      errors.push(`${field} must be one of: yes, no`);
    }
  });

  // Length checks for optional text fields
  if (
    req.body.profession &&
    !validator.isLength(req.body.profession, { max: 200 })
  ) {
    errors.push("profession cannot exceed 200 characters");
  }
  if (
    req.body.studiedSharia &&
    !validator.isLength(req.body.studiedSharia, { max: 1000 })
  ) {
    errors.push("studiedSharia cannot exceed 1000 characters");
  }
  if (
    req.body.talents &&
    !validator.isLength(req.body.talents, { max: 1000 })
  ) {
    errors.push("talents cannot exceed 1000 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Check if email already exists
  const existingUser = await User.findOne({
    email: req.body.email.toLowerCase(),
  });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  const newElder = await createUser(req.body, "elder");
  createSendToken(newElder, 201, res);
});

exports.signupAdmin = catchAsync(async (req, res, next) => {
  const { name, email, password, phone, department, permissions } = req.body;

  const errors = [];

  if (!name || !validator.isLength(name, { min: 2, max: 100 })) {
    errors.push("Name must be between 2 and 100 characters");
  }

  if (!password || !validator.isLength(password, { min: 6 })) {
    errors.push("Password must be at least 6 characters long");
  }

  if (!email || !validator.isEmail(email)) {
    errors.push("Email must be valid");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new AppError("Email already registered", 400));
  }

  const adminData = {
    name: validator.escape(name).trim(),
    email: validator.escape(email).trim().toLowerCase(),
    password,
    role: "admin",
    phone: phone ? validator.escape(phone).trim() : undefined,
    department: department ? validator.escape(department).trim() : undefined,
    permissions: permissions || [],
    isActive: true,
  };

  const newAdmin = await User.create(adminData);
  createSendToken(newAdmin, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    return next(new AppError("Incorrect email or password", 401));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};

exports.checkAuth = (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      status: "success",
      user,
    });
  } catch (error) {
    res.status(500).json("internal server error " + error);
  }
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check of it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }

  // 4) Check if user is active
  if (!user.isActive) {
    return next(
      new AppError("حسابك لم يعد نشط الان يرجى التواصل مع الادمن", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = user;
  next();
});

exports.profile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("groups", "title level")
    .populate("courses", "title category");

  res.status(200).json({
    status: "success",
    data: user,
  });
});

exports.updateProfile = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const {
    name,
    email,
    currentPassword,
    newPassword,
    confirmPassword,
    ...otherFields
  } = req.body;

  const user = await User.findById(userId).select("+password");

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  // Update basic fields if provided
  if (req.file) user.profileImage = `/uploads/${req.file.filename}`;
  if (name) user.name = name;
  if (email) user.email = email.toLowerCase();

  // Update other allowed fields based on user role
  const allowedFields = [
    "phone",
    "age",
    "address",
    "level",
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

  // Role-specific fields
  if (user.role === "student") {
    allowedFields.push(
      "parentPhone",
      "parentJob",
      "schoolType",
      "grade",
      "parentsMemorize",
      "parentMemorize",
      "attendNoorCourse",
      "planFinishQuran"
    );
  } else if (user.role === "teacher") {
    allowedFields.push(
      "education",
      "specialization",
      "experience",
      "qualifications",
      "hasIjaza",
      "tookIqraCourse",
      "taughtTuhfa",
      "workedInTahfeez",
      "workedInNurseries",
      "husbandApproves",
      "husbandPrays",
      "intentions",
      "preservationPlans",
      "preservationFruits",
      "khatmaPlan",
      "computerSkills"
    );
  } else if (user.role === "elder") {
    allowedFields.push("profession", "department", "permissions");
  } else if (user.role === "admin") {
    allowedFields.push("department", "permissions");
  }

  // Filter and update allowed fields
  Object.keys(otherFields).forEach((field) => {
    if (allowedFields.includes(field)) {
      user[field] = otherFields[field];
    }
  });

  // Handle password change
  if (currentPassword || newPassword || confirmPassword) {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(
        new AppError(
          "Provide currentPassword, newPassword, and confirmPassword to change password.",
          400
        )
      );
    }

    // Check current password
    const isMatch = await user.correctPassword(currentPassword, user.password);
    if (!isMatch) {
      return next(new AppError("Current password is incorrect.", 400));
    }

    // Check new password match
    if (newPassword !== confirmPassword) {
      return next(
        new AppError("New password and confirm password do not match.", 400)
      );
    }

    user.password = newPassword;
  }

  await user.save();
  createSendToken(user, 200, res);
});

// Additional auth utilities
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    return next(
      new AppError("Please provide password and confirm password", 400)
    );
  }

  if (password !== confirmPassword) {
    return next(new AppError("Passwords do not match", 400));
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});
