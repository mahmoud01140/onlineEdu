require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const connectDB = require("./config/db");

// const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const path = require("path");
const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://online-edu-front.vercel.app",
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb", extended: true }));

// db connection
connectDB();
const { AppError } = require("./middleware/error");
const { globalErrorHandler } = require("./middleware/error");
const authRouter = require("./routes/authRoutes");
const courseRoutes = require("./routes/courseRoutes");
const userRoutes = require("./routes/userRoutes");
const examRoutes = require("./routes/examRoutes");
const groupRoutes = require("./routes/groupRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const studyRoutes = require("./routes/studyRoutes");
const dashboardRoutes = require("./routes/adminStudyRoutes");
const liveExamRoutes = require("./routes/liveExamRoutes");
const exportRoutes = require("./routes/exportRoutes");

// 1) GLOBAL MIDDLEWARES
// Enable CORS

app.options("*", cors());

// Set security HTTP headers
app.use(helmet());

// Development logging
// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

// Serving static files
app.use(express.static(path.join(__dirname, "public")));

// Compress all responses
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.get("/testapp", (req, res) => {
  res.send("hello");
});
app.use("/api/auth", authRouter);
app.use("/api/courses", courseRoutes);
app.use("/api/users", userRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/studyAdmin", dashboardRoutes);
app.use("/api/liveExam", liveExamRoutes);
app.use("/api/export", exportRoutes);
// Handle unhandled routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// running server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
