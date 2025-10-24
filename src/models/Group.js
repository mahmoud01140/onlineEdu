const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  level: {
    type: String,
    enum: ["تاسيس", "حفظ"],
    required: true,
  },
  insturctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  maxStudents: {
    type: Number,
    default: 20,
  },
 schedule: {
    days: [{
      type: String,
      enum: ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"]
    }],
    time: String,
    duration: Number // المدة بالدقائق
  },
  inActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// تحديث updatedAt قبل حفظ المستند
groupSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// إنشاء نموذج الدورة
const Group = mongoose.model("Group", groupSchema);

module.exports = Group;
