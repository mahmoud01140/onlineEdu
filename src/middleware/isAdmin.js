const catchAsync = require("../utils/catchAsync");
const { AppError } = require("../middleware/error");
const isAdmin = catchAsync(async (req, res, next) => {
  if (req.user.role != "admin") {
    return next(new AppError("You are not Admin", 401));
  }

  next();
});
module.exports = isAdmin;
