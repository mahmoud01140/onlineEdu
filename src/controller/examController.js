const catchAsync = require("../utils/catchAsync");
const { Exam } = require("../models/Exam");
const { AppError } = require("../middleware/error");
const User = require("../models/User");
// الحصول على الامتحان حسب النوع
exports.getExams = catchAsync(async (req, res, next) => {
  const exams = await Exam.find().populate("lesson", "title");

  if (!exams) {
    return next(new AppError("لا يوجد امتحانات", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      exams,
    },
  });
});
exports.getExamByType = catchAsync(async (req, res, next) => {
  const { type } = req.params;

  const exam = await Exam.findOne({ examType: type });
  console.log(exam);
  if (!exam) {
    return next(new AppError("لا يوجد امتحان من هذا النوع", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      exam,
    },
  });
});
exports.deleteExam = catchAsync(async (req, res, next) => {
  const { id: examId } = req.params;
  const user = await User.findByIdAndUpdate(req.user._id,{
    $pull:{
      exams:{
        exam:examId
      }
    }
  })

  const exam = await Exam.findByIdAndDelete(examId);

  if (!exam) {
    return next(new AppError("الامتحان غير موجود", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      exam,
    },
  });
});
exports.fetchLessonExams = catchAsync(async (req, res, next) => {
  const { lessonId } = req.params;

  const exams = await Exam.find({ lesson: lessonId });

  if (!exams) {
    return next(new AppError("لا يوجد امتحانات لهذا الدرس", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      exams,
    },
  });
});
// تصحيح الإجابات
exports.submitExam = catchAsync(async (req, res, next) => {
  const { id: examId } = req.params;
  const { answers } = req.body;

  const exam = await Exam.findById(examId);

  if (!exam) {
    return next(new AppError("الامتحان غير موجود", 404));
  }

  // حساب النتيجة
  let score = 0;
  const results = exam.questions.map((question, index) => {
    const isCorrect = question.correctAnswer === answers[index];
    if (isCorrect) score++;

    return {
      question: question.question,
      userAnswer: answers[index],
      correctAnswer: question.correctAnswer,
      isCorrect,
    };
  });

  // التحقق إذا اجتاز الامتحان
  const isPassed = score >= exam.passingScore;
  // تحديث النتيجة في المستخدم
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new AppError("المستخدم غير موجود", 404));
  }
  // التحقق إذا كان المستخدم قد أجتاز الامتحان بالفعل
  const existingExam = user.exams.find(
    (exam) => exam.exam.toString() === examId
  );
  if (existingExam) {
    return next(new AppError("لقد أجتاز الامتحان بالفعل", 400));
  }
  user.isPasslevelEx = true;

  console.log(user)
  user.exams.push({
    exam: examId,
    examResult: score.toString(),
  });
  
  await user.save();
  res.status(200).json({
    status: "success",
    data: {
      score,
      totalQuestions: exam.questions.length,
      passingScore: exam.passingScore,
      isPassed,
      results,
    },
  });
});
// إنشاء امتحان جديد (للمشرفين)
exports.createExam = catchAsync(async (req, res, next) => {
  const { title, examType, questions, passingScore, lesson } = req.body;
  console.log(req.body);
  if (!title || !examType || !questions || !passingScore) {
    return next(new AppError("يرجى ملء جميع الحقول", 400));
  }
  if (
    examType &&
    !["student", "teacher", "elder", "lesson"].includes(examType)
  ) {
    return res.status(400).json({
      success: false,
      message: "نوع الامتحان غير صحيح",
    });
  }

  if (examType !== "lesson") {
    const existingType = await Exam.findOne({ examType });
    if (existingType) {
      return next(new AppError("هذا النوع من الامتحان موجود بالفعل", 400));
    }
  }
  if (
    passingScore &&
    (passingScore < 1 ||
      passingScore > (questions?.length || existingExam.questions.length))
  ) {
    return res.status(400).json({
      success: false,
      message: "درجة النجاح يجب أن تكون بين 1 وعدد الأسئلة",
    });
  }

  const exam = await Exam.create({
    title,
    examType,
    lesson,
    questions,
    passingScore,
  });

  res.status(201).json({
    status: "success",
    data: {
      exam,
    },
  });
});
// تحديث امتحان
exports.updateExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, examType, lesson, questions, passingScore } = req.body;

  // التحقق من وجود الامتحان
  const existingExam = await Exam.findById(id);
  if (!existingExam) {
    return res.status(404).json({
      success: false,
      message: "الامتحان غير موجود",
    });
  }

  // التحقق من صحة البيانات
  if (title && title.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "عنوان الامتحان مطلوب",
    });
  }

  if (
    examType &&
    !["student", "teacher", "elder", "lesson"].includes(examType)
  ) {
    return res.status(400).json({
      success: false,
      message: "نوع الامتحان غير صحيح",
    });
  }

  if (
    passingScore &&
    (passingScore < 1 ||
      passingScore > (questions?.length || existingExam.questions.length))
  ) {
    return res.status(400).json({
      success: false,
      message: "درجة النجاح يجب أن تكون بين 1 وعدد الأسئلة",
    });
  }

  // التحقق من صحة الأسئلة إذا تم إرسالها
  if (questions && Array.isArray(questions)) {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.question || question.question.trim() === "") {
        return res.status(400).json({
          success: false,
          message: `نص السؤال ${i + 1} مطلوب`,
        });
      }

      if (
        !question.options ||
        !Array.isArray(question.options) ||
        question.options.length !== 4
      ) {
        return res.status(400).json({
          success: false,
          message: `يجب أن يحتوي السؤال ${i + 1} على 4 خيارات`,
        });
      }

      for (let j = 0; j < question.options.length; j++) {
        if (!question.options[j] || question.options[j].trim() === "") {
          return res.status(400).json({
            success: false,
            message: `الخيار ${j + 1} في السؤال ${i + 1} مطلوب`,
          });
        }
      }

      if (
        question.correctAnswer === undefined ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3
      ) {
        return res.status(400).json({
          success: false,
          message: `الإجابة الصحيحة للسؤال ${i + 1} يجب أن تكون بين 0 و 3`,
        });
      }
    }
  }

  // تجهيز بيانات التحديث
  const updateData = {};
  if (title) updateData.title = title.trim();
  if (examType) updateData.examType = examType;
  if (lesson) updateData.lesson = lesson;
  if (passingScore) updateData.passingScore = passingScore;
  if (questions) updateData.questions = questions;

  // تحديث الامتحان
  const updatedExam = await Exam.findByIdAndUpdate(
    id,
    { $set: updateData },
    {
      new: true,
      runValidators: true,
    }
  ).populate("lesson", "title description");

  res.status(200).json({
    success: true,
    message: "تم تحديث الامتحان بنجاح",
    data: {
      exam: updatedExam,
    },
  });
});
