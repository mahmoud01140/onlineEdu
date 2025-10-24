const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  students: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['مبتدئ', 'متوسط', 'متقدم'],
    required: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  // price: {
  //   type: Number,
  //   default: 0
  // },
  // instructor: {
  //   type: String,
  //   default: 'غير محدد'
  // },
  // startDate: {
  //   type: Date,
  //   default: Date.now
  // },
  // endDate: {
  //   type: Date
  // },
  // schedule: {
  //   type: String // مثل "السبت والاثنين والأربعاء من 5-6 مساءً"
  // },
  // lessons: {
  //   type: Number,
  //   default: 0
  // },
  // imageUrl: {
  //   type: String,
  //   default: ''
  // },
  // isActive: {
  //   type: Boolean,
  //   default: true
  // },
  // requirements: [{
  //   type: String
  // }],
  // learningOutcomes: [{
  //   type: String
  // }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تحديث updatedAt قبل حفظ المستند
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// إنشاء نموذج الدورة
const Course = mongoose.model('Course', courseSchema);

module.exports = Course;