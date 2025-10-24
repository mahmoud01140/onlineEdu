const catchAsync = require("../utils/catchAsync");
const Course = require("../models/Course");
const { AppError } = require("../middleware/error");

// إنشاء دورة جديدة
exports.createCourse = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    duration,
    level,
    category,
    rating,
    students
  } = req.body;
  // التحقق من وجود الحقول المطلوبة
  if (!title || !description || !duration || !level || !category) {
    return next(new AppError("الرجاء توفير جميع الحقول المطلوبة", 400));
  }
  const newCourse = await Course.create({
    title,
    description,
    duration,
    level,
    category,
    rating, 
    students
  });

  res.status(201).json({
    status: "success",
    data: {
      course: newCourse
    }
  });
});

// الحصول على جميع الدورات مع إمكانية التصفية والترتيب
exports.getAllCourses = catchAsync(async (req, res, next) => {
  // // بناء كائن الاستعلام
  // const queryObj = { ...req.query };
  // const excludedFields = ["page", "sort", "limit", "fields"];
  // excludedFields.forEach(el => delete queryObj[el]);

  // // التصفية المتقدمة
  // let queryStr = JSON.stringify(queryObj);
  // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  // let query = Course.find(JSON.parse(queryStr));

  // // الترتيب
  // if (req.query.sort) {
  //   const sortBy = req.query.sort.split(",").join(" ");
  //   query = query.sort(sortBy);
  // } else {
  //   query = query.sort("-createdAt");
  // }

  // // تحديد الحقول
  // if (req.query.fields) {
  //   const fields = req.query.fields.split(",").join(" ");
  //   query = query.select(fields);
  // } else {
  //   query = query.select("-__v");
  // }

  // // التقسيم إلى صفحات
  // const page = req.query.page * 1 || 1;
  // const limit = req.query.limit * 1 || 10;
  // const skip = (page - 1) * limit;

  // query = query.skip(skip).limit(limit);

  // تنفيذ الاستعلام
  // const courses = await query;
const courses = await Course.find();
  res.status(200).json({
    status: "success",
    results: courses.length,
    data: {
      courses
    }
  });
});

// الحصول على دورة بواسطة ID
// exports.getCourse = catchAsync(async (req, res, next) => {
//   const course = await Course.findById(req.params.id);

//   if (!course) {
//     return next(new AppError("لا توجد دورة بهذا المعرف", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       course
//     }
//   });
// });

// تحديث دورة
// exports.updateCourse = catchAsync(async (req, res, next) => {
//   const course = await Course.findByIdAndUpdate(
//     req.params.id,
//     req.body,
//     {
//       new: true,
//       runValidators: true
//     }
//   );

//   if (!course) {
//     return next(new AppError("لا توجد دورة بهذا المعرف", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       course
//     }
//   });
// });

// حذف دورة
exports.deleteCourse = catchAsync(async (req, res, next) => {
  const course = await Course.findByIdAndDelete(req.params.id);

  if (!course) {
    return next(new AppError("لا توجد دورة بهذا المعرف", 404));
  }

  res.status(204).json({
    status: "success",
    data: null
  });
});

// الحصول على إحصائيات الدورات
exports.getCourseStats = catchAsync(async (req, res, next) => {
  const stats = await Course.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: "$category",
        numCourses: { $sum: 1 },
        avgRating: { $avg: "$rating" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" }
      }
    },
    {
      $sort: { numCourses: -1 }
    }
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats
    }
  });
});

// زيادة عدد الطلاب في دورة
// exports.incrementStudents = catchAsync(async (req, res, next) => {
//   const course = await Course.findByIdAndUpdate(
//     req.params.id,
//     { $inc: { students: 1 } },
//     { new: true }
//   );

//   if (!course) {
//     return next(new AppError("لا توجد دورة بهذا المعرف", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       course
//     }
//   });
// });

// تحديث تقييم الدورة
// exports.updateRating = catchAsync(async (req, res, next) => {
//   const { rating } = req.body;

//   if (!rating || rating < 0 || rating > 5) {
//     return next(new AppError("التقييم يجب أن يكون بين 0 و 5", 400));
//   }

//   const course = await Course.findByIdAndUpdate(
//     req.params.id,
//     { rating },
//     { new: true, runValidators: true }
//   );

//   if (!course) {
//     return next(new AppError("لا توجد دورة بهذا المعرف", 404));
//   }

//   res.status(200).json({
//     status: "success",
//     data: {
//       course
//     }
//   });
// });