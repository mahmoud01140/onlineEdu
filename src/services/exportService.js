// services/exportService.js
const ExcelJS = require('exceljs');
const { Document, Paragraph, Table, TableCell, TableRow, Packer, TextRun, HeadingLevel } = require('docx');
const User = require('../models/User');
const Group = require('../models/Group');
const Lesson = require('../models/Lesson');
const Attendance = require('../models/Attendance');
const { Exam } = require('../models/Exam');

class ExportService {
  // Enhanced Excel export with comprehensive user data


static async exportAttendanceToExcel(filters = {}) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'System';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Main Attendance Sheet
      const attendanceSheet = workbook.addWorksheet('تقرير الحضور والغياب');

      // Define comprehensive columns for attendance
      attendanceSheet.columns = [
        { header: 'م', key: 'index', width: 6 },
        { header: 'اسم الطالب', key: 'studentName', width: 25 },
        { header: 'البريد الإلكتروني', key: 'studentEmail', width: 30 },
        { header: 'المجموعة', key: 'groupName', width: 20 },
        { header: 'الدرس', key: 'lessonTitle', width: 30 },
        { header: 'التاريخ', key: 'date', width: 15 },
        { header: 'اليوم', key: 'day', width: 12 },
        { header: 'الحالة', key: 'status', width: 12 },
        { header: 'ملاحظات', key: 'notes', width: 30 },
        { header: 'مسجل بواسطة', key: 'markedBy', width: 20 },
        { header: 'وقت التسجيل', key: 'createdAt', width: 15 }
      ];

      // Style header row
      const headerRow = attendanceSheet.getRow(1);
      headerRow.font = { 
        bold: true, 
        color: { argb: 'FFFFFF' },
        size: 11
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DC3545' } // Red for absence focus
      };
      headerRow.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };

      // Get attendance data with filters
      const attendanceData = await this.getAttendanceForExport(filters);

      // Add data rows
      attendanceData.forEach((record, index) => {
        const row = attendanceSheet.addRow({
          index: index + 1,
          studentName: record.student?.name || 'غير محدد',
          studentEmail: record.student?.email || 'غير محدد',
          groupName: record.group?.title || 'غير محدد',
          lessonTitle: record.lesson?.title || 'غير محدد',
          date: record.date ? new Date(record.date).toLocaleDateString('ar-SA') : 'غير محدد',
          day: record.date ? this.getArabicDayName(record.date) : 'غير محدد',
          status: this.translateAttendanceStatus(record.status),
          notes: record.notes || 'لا يوجد',
          markedBy: record.markedByUser?.name || 'غير محدد',
          createdAt: record.createdAt ? new Date(record.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'
        });

        // Style data rows with color coding based on status
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'right',
            wrapText: true
          };
          cell.font = { size: 10 };
        });

        // Color code based on status
        let color = 'FFFFFF'; // Default white
        if (record.status === 'absent') {
          color = 'F8D7DA'; // Light red for absent
        } else if (record.status === 'present') {
          color = 'D4EDDA'; // Light green for present
        } else if (record.status === 'late') {
          color = 'FFF3CD'; // Light yellow for late
        } else if (record.status === 'excused') {
          color = 'E2E3E5'; // Light gray for excused
        }

        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color }
          };
        });
      });

      // Add Summary Sheet
      await this.addAttendanceSummarySheet(workbook, attendanceData, filters);

      // Add Student Absence Statistics Sheet
      await this.addStudentAbsenceStatsSheet(workbook, attendanceData);

      // Freeze header row
      attendanceSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];

      // Auto filter
      attendanceSheet.autoFilter = {
        from: 'A1',
        to: `K${attendanceData.length + 1}`
      };

      return workbook;
    } catch (error) {
      console.error('Attendance export error:', error);
      throw new Error('فشل في إنشاء تقرير الحضور والغياب');
    }
  }

  // Add Attendance Summary Sheet
  static async addAttendanceSummarySheet(workbook, attendanceData, filters) {
    const summarySheet = workbook.addWorksheet('ملخص الحضور');

    summarySheet.columns = [
      { header: 'نوع التقرير', key: 'reportType', width: 25 },
      { header: 'القيمة', key: 'value', width: 20 }
    ];

    // Style header
    const headerRow = summarySheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6F42C1' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Calculate statistics
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.filter(r => r.status === 'absent').length;
    const lateCount = attendanceData.filter(r => r.status === 'late').length;
    const excusedCount = attendanceData.filter(r => r.status === 'excused').length;
    
    const attendanceRate = totalRecords > 0 ? ((presentCount / totalRecords) * 100).toFixed(2) : 0;
    const absenceRate = totalRecords > 0 ? ((absentCount / totalRecords) * 100).toFixed(2) : 0;

    const summaryData = [
      { reportType: 'الفترة الزمنية', value: this.getDateRangeText(filters) },
      { reportType: 'إجمالي السجلات', value: totalRecords },
      { reportType: 'عدد الحضور', value: presentCount },
      { reportType: 'عدد الغياب', value: absentCount },
      { reportType: 'عدد المتأخرين', value: lateCount },
      { reportType: 'عدد المعذورين', value: excusedCount },
      { reportType: 'نسبة الحضور', value: `${attendanceRate}%` },
      { reportType: 'نسبة الغياب', value: `${absenceRate}%` },
      { reportType: 'تاريخ إنشاء التقرير', value: new Date().toLocaleDateString('ar-SA') }
    ];

    let rowIndex = 2;
    summaryData.forEach((item, index) => {
      const row = summarySheet.addRow({
        reportType: item.reportType,
        value: item.value
      });

      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { size: 11 };
      });

      // Highlight important metrics
      if (item.reportType === 'نسبة الغياب' && parseFloat(absenceRate) > 20) {
        row.getCell('value').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8D7DA' }
        };
        row.getCell('value').font = { color: { argb: '721C24' }, bold: true };
      }

      if (item.reportType === 'نسبة الحضور' && parseFloat(attendanceRate) > 80) {
        row.getCell('value').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'D4EDDA' }
        };
        row.getCell('value').font = { color: { argb: '155724' }, bold: true };
      }

      rowIndex++;
    });

    summarySheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }

  // Add Student Absence Statistics Sheet
  static async addStudentAbsenceStatsSheet(workbook, attendanceData) {
    const statsSheet = workbook.addWorksheet('إحصائيات الطلاب');

    statsSheet.columns = [
      { header: 'اسم الطالب', key: 'studentName', width: 25 },
      { header: 'المجموعة', key: 'groupName', width: 20 },
      { header: 'إجمالي الحضور', key: 'totalPresent', width: 15 },
      { header: 'إجمالي الغياب', key: 'totalAbsent', width: 15 },
      { header: 'إجمالي المتأخرين', key: 'totalLate', width: 15 },
      { header: 'إجمالي المعذورين', key: 'totalExcused', width: 15 },
      { header: 'نسبة الحضور', key: 'attendanceRate', width: 15 },
      { header: 'نسبة الغياب', key: 'absenceRate', width: 15 }
    ];

    // Style header
    const headerRow = statsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FD7E14' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Calculate student statistics
    const studentStats = {};
    attendanceData.forEach(record => {
      const studentId = record.student?._id?.toString();
      if (!studentId) return;

      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          studentName: record.student?.name || 'غير محدد',
          groupName: record.group?.title || 'غير محدد',
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          totalExcused: 0,
          totalRecords: 0
        };
      }

      studentStats[studentId].totalRecords++;
      if (record.status === 'present') studentStats[studentId].totalPresent++;
      if (record.status === 'absent') studentStats[studentId].totalAbsent++;
      if (record.status === 'late') studentStats[studentId].totalLate++;
      if (record.status === 'excused') studentStats[studentId].totalExcused++;
    });

    // Add student rows
    let rowIndex = 2;
    Object.values(studentStats).forEach((student, index) => {
      const totalRecords = student.totalRecords;
      const attendanceRate = totalRecords > 0 ? ((student.totalPresent / totalRecords) * 100).toFixed(2) : 0;
      const absenceRate = totalRecords > 0 ? (((student.totalAbsent + student.totalLate) / totalRecords) * 100).toFixed(2) : 0;

      const row = statsSheet.addRow({
        studentName: student.studentName,
        groupName: student.groupName,
        totalPresent: student.totalPresent,
        totalAbsent: student.totalAbsent,
        totalLate: student.totalLate,
        totalExcused: student.totalExcused,
        attendanceRate: `${attendanceRate}%`,
        absenceRate: `${absenceRate}%`
      });

      // Style row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.font = { size: 10 };
      });

      // Highlight students with high absence rates
      if (parseFloat(absenceRate) > 30) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F8D7DA' }
          };
        });
        row.getCell('absenceRate').font = { color: { argb: '721C24' }, bold: true };
      }

      // Highlight students with excellent attendance
      if (parseFloat(attendanceRate) >= 95) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'D4EDDA' }
          };
        });
        row.getCell('attendanceRate').font = { color: { argb: '155724' }, bold: true };
      }

      rowIndex++;
    });

    statsSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];

    // Auto filter
    statsSheet.autoFilter = {
      from: 'A1',
      to: `H${Object.keys(studentStats).length + 1}`
    };
  }

  // Get attendance data with filters
  static async getAttendanceForExport(filters = {}) {
    try {
      const query = {};

      // Apply filters
      if (filters.groupId) {
        query.group = filters.groupId;
      }
      
      if (filters.studentId) {
        query.student = filters.studentId;
      }
      
      if (filters.status && filters.status !== 'all') {
        query.status = filters.status;
      }
      
      if (filters.startDate && filters.endDate) {
        query.date = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      } else if (filters.startDate) {
        query.date = { $gte: new Date(filters.startDate) };
      } else if (filters.endDate) {
        query.date = { $lte: new Date(filters.endDate) };
      }

      // If no date range specified, get last 30 days
      if (!filters.startDate && !filters.endDate) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.date = { $gte: thirtyDaysAgo };
      }

      const attendanceData = await Attendance.find(query)
        .populate('student', 'name email')
        .populate('group', 'title')
        .populate('lesson', 'title')
        .populate('markedBy', 'name')
        .sort({ date: -1, student: 1 })
        .lean();

      return attendanceData;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      throw new Error('فشل في جلب بيانات الحضور');
    }
  }

  // Helper method to get Arabic day name
  static getArabicDayName(date) {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[new Date(date).getDay()];
  }

  // Helper method to get date range text
  static getDateRangeText(filters) {
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).toLocaleDateString('ar-SA');
      const end = new Date(filters.endDate).toLocaleDateString('ar-SA');
      return `من ${start} إلى ${end}`;
    } else if (filters.startDate) {
      const start = new Date(filters.startDate).toLocaleDateString('ar-SA');
      return `من ${start} إلى الآن`;
    } else if (filters.endDate) {
      const end = new Date(filters.endDate).toLocaleDateString('ar-SA');
      return `حتى ${end}`;
    } else {
      return 'آخر 30 يوم';
    }
  }






  static async exportUsersToExcel(users) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'System';
      workbook.lastModifiedBy = 'System';
      workbook.created = new Date();
      workbook.modified = new Date();

      // Main Users Sheet
      const usersSheet = workbook.addWorksheet('بيانات المستخدمين');

      // Define comprehensive columns
      usersSheet.columns = [
        { header: 'م', key: 'index', width: 6 },
        { header: 'الاسم', key: 'name', width: 25 },
        { header: 'البريد الإلكتروني', key: 'email', width: 30 },
        { header: 'الدور', key: 'role', width: 12 },
        { header: 'الهاتف', key: 'phone', width: 15 },
        { header: 'العمر', key: 'age', width: 8 },
        { header: 'المستوى', key: 'level', width: 12 },
        { header: 'المحفوظ', key: 'memorizedAmount', width: 20 },
        { header: 'المجموعات', key: 'groups', width: 25 },
        { header: 'نوع المدرسة', key: 'schoolType', width: 15 },
        { header: 'الصف', key: 'grade', width: 12 },
        { header: 'هاتف ولي الأمر', key: 'parentPhone', width: 15 },
        { header: 'التعليم', key: 'education', width: 20 },
        { header: 'التخصص', key: 'specialization', width: 20 },
        { header: 'الخبرة', key: 'experience', width: 10 },
        { header: 'المهنة', key: 'profession', width: 15 },
        { header: 'الحالة الاجتماعية', key: 'maritalStatus', width: 15 },
        { header: 'عدد الأطفال', key: 'children', width: 12 },
        { header: 'يصلي الخمس', key: 'praysFive', width: 10 },
        { header: 'يحفظ الأذكار', key: 'keepsAdhkar', width: 10 },
        { header: 'يصوم الاثنين والخميس', key: 'fastsMondayThursday', width: 15 },
        { header: 'اجتاز الامتحان الحي', key: 'isPassLiveEx', width: 12 },
        { header: 'اجتاز امتحان المستوى', key: 'isPasslevelEx', width: 12 },
        { header: 'الحالة', key: 'status', width: 10 },
        { header: 'تاريخ التسجيل', key: 'createdAt', width: 15 }
      ];

      // Style header row
      const headerRow = usersSheet.getRow(1);
      headerRow.font = { 
        bold: true, 
        color: { argb: 'FFFFFF' },
        size: 11
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '2E86AB' }
      };
      headerRow.alignment = { 
        vertical: 'middle', 
        horizontal: 'center',
        wrapText: true
      };

      // Add data rows
      users.forEach((user, index) => {
        const groupsText = user.groups && user.groups.length > 0 
          ? user.groups.map(g => g.title).join(', ')
          : 'لا يوجد';

        const row = usersSheet.addRow({
          index: index + 1,
          name: user.name || 'غير محدد',
          email: user.email || 'غير محدد',
          role: this.translateRole(user.role),
          phone: user.phone || 'غير محدد',
          age: user.age || 'غير محدد',
          level: user.level || 'مبتدئ',
          memorizedAmount: user.memorizedAmount || 'غير محدد',
          groups: groupsText,
          schoolType: user.schoolType || 'غير محدد',
          grade: user.grade || 'غير محدد',
          parentPhone: user.parentPhone || 'غير محدد',
          education: user.education || 'غير محدد',
          specialization: user.specialization || 'غير محدد',
          experience: user.experience || 0,
          profession: user.profession || 'غير محدد',
          maritalStatus: this.translateMaritalStatus(user.maritalStatus),
          children: user.children || 0,
          praysFive: user.praysFive === 'yes' ? 'نعم' : 'لا',
          keepsAdhkar: user.keepsAdhkar === 'yes' ? 'نعم' : 'لا',
          fastsMondayThursday: user.fastsMondayThursday === 'yes' ? 'نعم' : 'لا',
          isPassLiveEx: user.isPassLiveEx ? 'نعم' : 'لا',
          isPasslevelEx: user.isPasslevelEx ? 'نعم' : 'لا',
          status: user.isActive ? 'نشط' : 'غير نشط',
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ar-SA') : 'غير محدد'
        });

        // Style data rows
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { 
            vertical: 'middle', 
            horizontal: 'right',
            wrapText: true
          };
          cell.font = { size: 10 };
        });

        // Alternate row colors
        if (index % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8F9FA' }
            };
          });
        }
      });

      // Freeze header row
      usersSheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
      ];

      // Add Attendance Sheet
      await this.addAttendanceSheet(workbook, users);

      // Add Exams Sheet
      await this.addExamsSheet(workbook, users);

      // Add Groups Sheet
      await this.addGroupsSheet(workbook, users);

      return workbook;
    } catch (error) {
      console.error('Excel export error:', error);
      throw new Error('فشل في إنشاء ملف Excel');
    }
  }

  // Add Attendance Sheet
  static async addAttendanceSheet(workbook, users) {
    const attendanceSheet = workbook.addWorksheet('الحضور والغياب');

    attendanceSheet.columns = [
      { header: 'اسم المستخدم', key: 'userName', width: 25 },
      { header: 'المجموعة', key: 'groupName', width: 20 },
      { header: 'الدرس', key: 'lessonTitle', width: 30 },
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'ملاحظات', key: 'notes', width: 30 }
    ];

    // Style header
    const headerRow = attendanceSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '28A745' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let rowIndex = 2;

    for (const user of users) {
      const attendanceRecords = await Attendance.find({ student: user._id })
        .populate('lesson', 'title')
        .populate('group', 'title')
        .sort({ date: -1 })
        .limit(50) // Limit to last 50 records per user
        .lean();

      for (const record of attendanceRecords) {
        const row = attendanceSheet.addRow({
          userName: user.name,
          groupName: record.group?.title || 'غير محدد',
          lessonTitle: record.lesson?.title || 'غير محدد',
          date: record.date ? new Date(record.date).toLocaleDateString('ar-SA') : 'غير محدد',
          status: this.translateAttendanceStatus(record.status),
          notes: record.notes || 'لا يوجد'
        });

        // Style row
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.font = { size: 10 };
        });

        // Color code based on status
        if (record.status === 'present') {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'D4EDDA' }
            };
          });
        } else if (record.status === 'absent') {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8D7DA' }
            };
          });
        }

        rowIndex++;
      }
    }

    attendanceSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }

  // Add Exams Sheet
  static async addExamsSheet(workbook, users) {
    const examsSheet = workbook.addWorksheet('الامتحانات والنتائج');

    examsSheet.columns = [
      { header: 'اسم المستخدم', key: 'userName', width: 25 },
      { header: 'نوع الامتحان', key: 'examType', width: 20 },
      { header: 'عنوان الامتحان', key: 'examTitle', width: 30 },
      { header: 'النتيجة', key: 'result', width: 15 },
      { header: 'تاريخ الامتحان', key: 'examDate', width: 15 }
    ];

    // Style header
    const headerRow = examsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '6F42C1' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let rowIndex = 2;

    for (const user of users) {
      if (user.exams && user.exams.length > 0) {
        for (const examData of user.exams) {
          const exam = await Exam.findById(examData.exam).lean();
          
          const row = examsSheet.addRow({
            userName: user.name,
            examType: exam ? this.translateExamType(exam.examType) : 'غير محدد',
            examTitle: exam ? exam.title : 'غير محدد',
            result: examData.examResult || 'لم يتم التصحيح',
            examDate: examData.examDate ? new Date(examData.examDate).toLocaleDateString('ar-SA') : 'غير محدد'
          });

          // Style row
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.font = { size: 10 };
          });

          rowIndex++;
        }
      }
    }

    examsSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }

  // Add Groups Sheet
  static async addGroupsSheet(workbook, users) {
    const groupsSheet = workbook.addWorksheet('المجموعات');

    groupsSheet.columns = [
      { header: 'اسم المستخدم', key: 'userName', width: 25 },
      { header: 'المجموعة', key: 'groupTitle', width: 25 },
      { header: 'المستوى', key: 'groupLevel', width: 15 },
      { header: 'الوصف', key: 'groupDescription', width: 40 },
      { header: 'الحالة', key: 'groupStatus', width: 12 }
    ];

    // Style header
    const headerRow = groupsSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FD7E14' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    let rowIndex = 2;

    for (const user of users) {
      if (user.groups && user.groups.length > 0) {
        for (const group of user.groups) {
          const row = groupsSheet.addRow({
            userName: user.name,
            groupTitle: group.title || 'غير محدد',
            groupLevel: group.level || 'غير محدد',
            groupDescription: group.description || 'لا يوجد',
            groupStatus: group.inActive ? 'غير نشط' : 'نشط'
          });

          // Style row
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.font = { size: 10 };
          });

          // Color inactive groups
          if (group.inActive) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F8F9FA' }
              };
            });
          }

          rowIndex++;
        }
      }
    }

    groupsSheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }

  // Enhanced Word export
  static async exportUsersToWord(users) {
    try {
      const children = [];

      // Title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "تقرير شامل بيانات المستخدمين",
              bold: true,
              size: 32
            })
          ],
          alignment: 'center',
          heading: HeadingLevel.TITLE
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}`,
              size: 24
            })
          ],
          alignment: 'center'
        })
      );

      children.push(new Paragraph({ text: "" }));

      // Summary Section
      const roleCounts = {};
      const levelCounts = {};
      users.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
        levelCounts[user.level] = (levelCounts[user.level] || 0) + 1;
      });

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "ملخص الإحصائيات",
              bold: true,
              size: 28
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `إجمالي المستخدمين: ${users.length}`,
              size: 24
            })
          ]
        })
      );

      Object.entries(roleCounts).forEach(([role, count]) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${this.translateRole(role)}: ${count}`,
                size: 20
              })
            ]
          })
        );
      });

      children.push(new Paragraph({ text: "" }));

      // Users Table
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "بيانات المستخدمين",
              bold: true,
              size: 28
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      const tableRows = [];

      // Header row
      const headerCells = [
        'الاسم', 'البريد الإلكتروني', 'الدور', 'المستوى', 'المجموعات', 'الحالة'
      ].map(headerText => 
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: headerText,
                  bold: true,
                  color: "FFFFFF"
                })
              ],
              alignment: 'center'
            })
          ],
          shading: {
            fill: "2E86AB"
          }
        })
      );

      tableRows.push(new TableRow({
        children: headerCells
      }));

      // Data rows
      users.forEach((user) => {
        const groupsText = user.groups && user.groups.length > 0 
          ? user.groups.map(g => g.title).join(', ')
          : 'لا يوجد';

        const dataCells = [
          user.name || 'غير محدد',
          user.email || 'غير محدد',
          this.translateRole(user.role),
          user.level || 'مبتدئ',
          groupsText,
          user.isActive ? 'نشط' : 'غير نشط'
        ].map(cellText =>
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cellText
                  })
                ],
                alignment: 'right'
              })
            ]
          })
        );

        tableRows.push(new TableRow({
          children: dataCells
        }));
      });

      children.push(new Table({
        rows: tableRows,
        width: {
          size: 100,
          type: 'pct'
        }
      }));

      const doc = new Document({
        sections: [{
          properties: {},
          children: children
        }]
      });

      return doc;
    } catch (error) {
      console.error('Word export error:', error);
      throw new Error('فشل في إنشاء ملف Word');
    }
  }

  // Get comprehensive user data
  static async getUsersForExport(filters = {}) {
    try {
      const query = {};

      if (filters.role) query.role = filters.role;
      if (filters.level) query.level = filters.level;
      if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true';
      if (filters.search) {
        query.$or = [
          { name: { $regex: filters.search, $options: 'i' } },
          { email: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const users = await User.find(query)
        .select('-password')
        .populate({
          path: 'groups',
          select: 'title level description inActive'
        })
        .populate({
          path: 'courses',
          select: 'title description'
        })
        .populate({
          path: 'exams.exam',
          select: 'title examType passingScore'
        })
        .sort({ createdAt: -1 })
        .lean();

      return users;
    } catch (error) {
      console.error('Error fetching users for export:', error);
      throw new Error('فشل في جلب بيانات المستخدمين');
    }
  }

  // Helper methods
  static translateRole(role) {
    const roles = {
      'student': 'طالب',
      'teacher': 'معلم',
      'elder': 'كبير',
      'admin': 'مدير'
    };
    return roles[role] || role;
  }

  static translateMaritalStatus(status) {
    const statuses = {
      'single': 'أعزب',
      'married': 'متزوج',
      'widowed': 'أرمل',
      'divorced': 'مطلق',
      'other': 'أخرى'
    };
    return statuses[status] || status;
  }

  static translateAttendanceStatus(status) {
    const statuses = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر',
      'excused': 'معذور'
    };
    return statuses[status] || status;
  }

  static translateExamType(type) {
    const types = {
      'student': 'طالب',
      'teacher': 'معلم',
      'elder': 'كبير',
      'lesson': 'درس'
    };
    return types[type] || type;
  }
}

module.exports = ExportService;