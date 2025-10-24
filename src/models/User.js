const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Basic Information (Common to all roles)
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["student", "teacher", "elder", "admin"],
    default: "admin",
  },
  phone: {
    type: String,
    trim: true,
  },
  age: {
    type: Number,
    min: 0,
    max: 120,
  },
  address: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  isPassLiveEx: {
    type: Boolean,
    default: false,
  },
  isPasslevelEx: {
    type: Boolean,
    default: false,
  },
  // Profile Status
  isActive: {
    type: Boolean,
    default: true,
  },
  level: {
    type: String,
    enum: ["مبتدئ", "متوسط", "متقدم"],
    default: "مبتدئ",
  },
  profileImage: {
    type: String,
    default: "",
  },
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  exams: [
    {
      exam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exam",
        required: true,
      },
      examResult: {
        type: String,
      },
    },
  ],
  // Common Fields for All Roles
  availableTime: {
    type: String,
    trim: true,
  },
  memorizedAmount: {
    type: String,
    trim: true,
  },
  studiedSharia: {
    type: String,
    trim: true,
  },
  talents: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  canUseTelegramZoom: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  dailyMemorization: {
    type: String,
    trim: true,
  },
  dailyReview: {
    type: String,
    trim: true,
  },
  dailyRecitation: {
    type: String,
    trim: true,
  },

  // Personal Information
  maritalStatus: {
    type: String,
    enum: ["single", "married", "widowed", "divorced", "other"],
    default: "single",
  },
  children: {
    type: Number,
    min: 0,
    default: 0,
  },
  hasChildren: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  hasSiblings: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },

  // Religious Practices (Common)
  praysFive: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  prayerFive: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  keepsAdhkar: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  adhkar: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  fastsMondayThursday: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },

  // STUDENT Specific Fields
  schoolType: {
    type: String,
    enum: ["عام", "ازهر", "أخرى"],
    default: "عام",
  },
  grade: {
    type: String,
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  parentJob: {
    type: String,
    trim: true,
  },
  parentsMemorize: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedFath: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedTuhfa: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedNoor: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  dailyMemorize: {
    type: String,
  },
  attendNoorCourse: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  parentMemorize: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  planFinishQuran: {
    type: String,
  },

  // TEACHER Specific Fields
  education: {
    type: String,
    trim: true,
  },
  hasIjaza: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  tookIqraCourse: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedTuhfa: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  taughtTuhfa: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  workedInTahfeez: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  workedInNurseries: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  husbandApproves: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  husbandPrays: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  intentions: {
    type: String,
    trim: true,
  },
  preservationPlans: {
    type: String,
    trim: true,
  },
  preservationFruits: {
    type: String,
    trim: true,
  },
  khatmaPlan: {
    type: String,
    trim: true,
  },
  computerSkills: {
    type: String,
    trim: true,
  },
  specialization: {
    type: String,
    trim: true,
  },
  experience: {
    type: Number,
    default: 0,
  },
  qualifications: {
    type: String,
    trim: true,
  },

  // ELDER Specific Fields
  profession: {
    type: String,
    trim: true,
  },
  studiedTajweed: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedFath: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },
  studiedTuhfat: {
    type: String,
    enum: ["yes", "no"],
    default: "no",
  },

  // ADMIN/System Fields
  permissions: {
    type: [String],
    default: [],
  },
  department: {
    type: String,
    trim: true,
  },

  // Groups and Courses References
  groups: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
  ],
  courses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Keep updatedAt current
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving (if modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare passwords
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for role-specific validation
userSchema.pre("save", function (next) {
  // Set required fields based on role
  if (this.role === "student") {
    if (!this.age) {
      return next(new Error("Age is required for students"));
    }
    if (!this.parentPhone) {
      return next(new Error("Parent phone is required for students"));
    }
  }

  if (this.role === "teacher") {
    if (!this.availableTime) {
      return next(new Error("Available time is required for teachers"));
    }
  }

  if (this.role === "elder") {
    if (!this.phone) {
      return next(new Error("Phone is required for elders"));
    }
    if (!this.address) {
      return next(new Error("Address is required for elders"));
    }
  }

  next();
});

// Index for better query performance
// userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ level: 1 });

// Static method to get users by role
userSchema.statics.getByRole = function (role) {
  return this.find({ role, isActive: true });
};

// Static method to get users with specific memorization amount
userSchema.statics.getByMemorization = function (amount) {
  return this.find({
    memorizedAmount: { $regex: amount, $options: "i" },
    isActive: true,
  });
};

// Instance method to get role-specific information
userSchema.methods.getRoleInfo = function () {
  const baseInfo = {
    name: this.name,
    email: this.email,
    role: this.role,
    age: this.age,
    memorizedAmount: this.memorizedAmount,
  };

  if (this.role === "student") {
    return {
      ...baseInfo,
      schoolType: this.schoolType,
      grade: this.grade,
      parentPhone: this.parentPhone,
      parentJob: this.parentJob,
    };
  }

  if (this.role === "teacher") {
    return {
      ...baseInfo,
      education: this.education,
      specialization: this.specialization,
      experience: this.experience,
      hasIjaza: this.hasIjaza,
    };
  }

  if (this.role === "elder") {
    return {
      ...baseInfo,
      profession: this.profession,
      phone: this.phone,
      address: this.address,
    };
  }

  return baseInfo;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
