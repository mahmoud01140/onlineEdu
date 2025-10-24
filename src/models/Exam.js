const mongoose = require("mongoose");

// نموذج السؤال
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [
    {
      type: String,
      required: true,
    },
  ],
  correctAnswer: {
    type: Number,
    required: true,
  },
});

const Question = mongoose.model("Question", questionSchema);

// نموذج الامتحان
const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  examType: {
    type: String,
    enum: ["student", "teacher", "elder", "lesson"],
    required: true,
  },
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lesson",
  },
  questions: [questionSchema],
  passingScore: {
    type: Number,
    required: true,
  },
});

const Exam = mongoose.model("Exam", examSchema);

// تهيئة الامتحانات الافتراضية

module.exports = { Exam, Question };
