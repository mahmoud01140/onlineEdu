const multer = require('multer');
const {AppError} = require('../middleware/error');


const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

// For materials upload
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `material-${req.user.id}-${Date.now()}.${ext}`);
  }
});

const materialFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf', // PDF
    'video/mp4', 'video/webm', 'video/ogg', // Videos
    'audio/mpeg', 'audio/ogg', 'audio/wav', // Audio
    'application/msword', // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-powerpoint', // PPT
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PPTX
    'image/jpeg', 'image/png', 'image/gif' // Images
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Unsupported file type! Please upload only allowed file types.', 400), false);
  }
};

exports.uploadMaterial = multer({
  storage: materialStorage,
  fileFilter: materialFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});