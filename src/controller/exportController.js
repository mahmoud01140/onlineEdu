// controllers/exportController.js
const ExportService = require('../services/exportService');
const catchAsync = require('../utils/catchAsync');
const { AppError } = require("../middleware/error");
const { Packer } = require('docx');

exports.exportUsers = catchAsync(async (req, res, next) => {
  try {
    const { format, role, level, isActive, search } = req.query;
    
    console.log('Export request received:', { format, role, level, isActive, search });

    // Get users based on filters
    const users = await ExportService.getUsersForExport({
      role,
      level,
      isActive,
      search
    });

    console.log(`Found ${users.length} users for export`);

    if (users.length === 0) {
      return next(new AppError('لا توجد بيانات للتصدير', 404));
    }

    if (format === 'word') {
      const doc = await ExportService.exportUsersToWord(users);
      
      // Generate buffer
      const buffer = await Packer.toBuffer(doc);
      
      // Set headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="users-report-${Date.now()}.docx"`);
      res.setHeader('Content-Length', buffer.length);
      
      // Send buffer
      res.send(buffer);
      
    } else {
      // Default to Excel
      const workbook = await ExportService.exportUsersToExcel(users);
      
      // Set headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="users-report-${Date.now()}.xlsx"`);
      
      // Write to response
      await workbook.xlsx.write(res);
      res.end();
    }
    
  } catch (error) {
    console.error('Export controller error:', error);
    return next(new AppError(error.message || 'فشل في تصدير البيانات', 500));
  }
});
// controllers/exportController.js - Add this method

exports.exportAttendance = catchAsync(async (req, res, next) => {
  try {
    const { 
      groupId, 
      studentId, 
      status, 
      startDate, 
      endDate 
    } = req.query;
    
    console.log('Attendance export request received:', { 
      groupId, 
      studentId, 
      status, 
      startDate, 
      endDate 
    });

    // Get attendance data based on filters
    const workbook = await ExportService.exportAttendanceToExcel({
      groupId,
      studentId,
      status,
      startDate,
      endDate
    });

    // Set headers
    const timestamp = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${timestamp}.xlsx"`);
    
    // Write to response
    await workbook.xlsx.write(res);
    res.end();
    
  } catch (error) {
    console.error('Attendance export controller error:', error);
    return next(new AppError(error.message || 'فشل في تصدير تقرير الحضور', 500));
  }
});