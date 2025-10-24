const catchAsync = require("../utils/catchAsync");
const { AppError } = require("../middleware/error");
const isPassFirstExams = catchAsync(async (req, res, next) => {
  if (!req.user.isPasslevelEx) {
    return next(
      new AppError("You must pass the level exam to access this resource.", 403)
    );
  }

  if (!req.user.isPassLiveEx) {
    return next(
      new AppError("You must pass the live exam to access this resource.", 403)
    );
  }

  next();
});
module.exports = isPassFirstExams;
