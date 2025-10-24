const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({
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
  group: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Group",
  },
  date: {
    type: Date,
    default: Date.now,
  },
  resources: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'audio', 'image', 'file', 'folder', 'link'],
      default: 'link',
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    previewUrl: {
      type: String,
      trim: true
    },
    fileId: {
      type: String,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  zoomLink: {
    type: String,
    trim: true
  },
  zoomPassword: {
    type: String,
    trim: true
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
lessonSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// إنشاء نموذج الدورة
const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
