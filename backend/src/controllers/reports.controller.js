const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');
const { determineGrade, calculatePosition, getGradingScales, invalidateScaleCache } = require('../services/grades');
const { generateReportCard, generateClassReport } = require('../services/pdf');

const getGradingScalesHandler = async (req, res) => {
  try {
    const scales = await getGradingScales();
    res.json(scales);
  } catch (error) {
    console.error('Grading scales fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch grading scales' });
  }
};

const createGradingScale = async (req, res) => {
  try {
    const newItem = await createItem('grading_scale', req.body);
    invalidateScaleCache();
    res.status(201).json(newItem.data);
  } catch (error) {
    console.error('Grading scale create error:', error.message);
    res.status(500).json({ error: 'Failed to create grading scale' });
  }
};

const updateGradingScale = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await updateItem('grading_scale', id, req.body);
    invalidateScaleCache();
    res.json(updated.data);
  } catch (error) {
    console.error('Grading scale update error:', error.message);
    res.status(500).json({ error: 'Failed to update grading scale' });
  }
};

const deleteGradingScale = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteItem('grading_scale', id);
    invalidateScaleCache();
    res.json({ success: true });
  } catch (error) {
    console.error('Grading scale delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete grading scale' });
  }
};

const getTeacherClassIds = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClasses' });
  const val = result.data?.assignedClasses;
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const getStudentReport = async (req, res) => {
  try {
    const { term, academicYear } = req.query;
    const { studentId } = req.params;

    const studentResult = await getItem('students', studentId, {
      fields: '*,classStreamId.*',
    });
    if (!studentResult.data) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.data;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = student.classStreamId?.id || student.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only view reports for your class' });
      }
    }

    const filter = { 'filter[studentId][_eq]': studentId };
    if (term) filter['filter[term][_eq]'] = term;
    if (academicYear) filter['filter[academicYear][_eq]'] = academicYear;

    const assessmentsResult = await getItems('assessments', {
      fields: '*,subjectId.*',
      ...filter,
    });
    const assessments = assessmentsResult.data || [];
    const scales = await getGradingScales();

    const subjectMap = new Map();
    assessments.forEach((a) => {
      if (!subjectMap.has(a.subjectId)) {
        subjectMap.set(a.subjectId, {
          name: a.subjectId?.name || 'Unknown',
          exam: 0,
          ca: 0,
        });
      }
      const entry = subjectMap.get(a.subjectId);
      if (a.type === 'exam') entry.exam = a.score;
      else entry.ca = a.score;
    });

    const subjects = Array.from(subjectMap.entries()).map(([sid, data]) => {
      const total = data.exam + data.ca;
      const grade = determineGrade(total, 100, scales);
      return {
        subjectId: sid,
        subjectName: data.name,
        examScore: data.exam,
        caScore: data.ca,
        total,
        grade: grade.grade,
        gradePoint: grade.gradePoint,
      };
    });

    const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
    const average = subjects.length > 0 ? totalMarks / subjects.length : 0;

    const allFilter = { 'filter[term][_eq]': term || 'term1' };
    if (academicYear) allFilter['filter[academicYear][_eq]'] = academicYear;
    const allAssessmentsResult = await getItems('assessments', {
      fields: '*,studentId.*',
      ...allFilter,
    });
    const allAssessments = allAssessmentsResult.data || [];

    const studentClassId = student.classStreamId?.id || student.classStreamId;
    const classStudentIds = [...new Set(
      allAssessments
        .filter((a) => {
          const sid = a.studentId?.classStreamId?.id || a.studentId?.classStreamId;
          return sid === studentClassId;
        })
        .map((a) => a.studentId?.id || a.studentId)
    )];

    const totalsMap = new Map();
    classStudentIds.forEach((sid) => {
      const sAssessments = allAssessments.filter((a) => (a.studentId?.id || a.studentId) === sid);
      const subMap = new Map();
      sAssessments.forEach((a) => {
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, { exam: 0, ca: 0 });
        const entry = subMap.get(a.subjectId);
        if (a.type === 'exam') entry.exam = a.score;
        else entry.ca = a.score;
      });
      const total = Array.from(subMap.values()).reduce((sum, s) => sum + s.exam + s.ca, 0);
      totalsMap.set(sid, total);
    });

    const positions = calculatePosition(
      Array.from(totalsMap.entries()).map(([sid, total]) => ({ studentId: sid, total }))
    );

    res.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        className: student.classStreamId?.name || '',
      },
      term: term || 'term1',
      academicYear: academicYear || new Date().getFullYear().toString(),
      subjects,
      totals: {
        totalMarks,
        average,
        classPosition: positions.get(student.id) || 0,
        totalStudents: classStudentIds.length,
      },
    });
  } catch (error) {
    console.error('Student report error:', error.message);
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

const getClassReport = async (req, res) => {
  try {
    const { term, academicYear } = req.query;
    const { classStreamId } = req.params;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (!classIds.includes(classStreamId)) {
        return res.status(403).json({ error: 'You can only view reports for your assigned class' });
      }
    }

    const classResult = await getItem('class_streams', classStreamId);
    if (!classResult.data) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const classStream = classResult.data;

    const studentsResult = await getItems('students', {
      'filter[classStreamId][_eq]': classStreamId,
    });
    const students = studentsResult.data || [];

    const scales = await getGradingScales();

    const filter = { 'filter[term][_eq]': term || 'term1' };
    if (academicYear) filter['filter[academicYear][_eq]'] = academicYear;

    const allAssessmentsResult = await getItems('assessments', {
      fields: '*,subjectId.*,studentId.*',
      ...filter,
    });
    const allAssessments = allAssessmentsResult.data || [];

    const studentResults = students.map((student) => {
      const sAssessments = allAssessments.filter((a) => (a.studentId?.id || a.studentId) === student.id);
      const subMap = new Map();
      sAssessments.forEach((a) => {
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, { name: a.subjectId?.name || 'Unknown', exam: 0, ca: 0 });
        const entry = subMap.get(a.subjectId);
        if (a.type === 'exam') entry.exam = a.score;
        else entry.ca = a.score;
      });

      const subjects = Array.from(subMap.entries()).map(([, data]) => {
        const total = data.exam + data.ca;
        const grade = determineGrade(total, 100, scales);
        return { name: data.name, total, grade: grade.grade };
      });

      const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
      return {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        subjects,
        totalMarks,
        average: subjects.length > 0 ? totalMarks / subjects.length : 0,
      };
    });

    const positions = calculatePosition(studentResults.map((s) => ({ studentId: s.studentId, total: s.totalMarks })));
    studentResults.forEach((s) => { s.position = positions.get(s.studentId) || 0; });
    studentResults.sort((a, b) => a.position - b.position);

    res.json({
      classStream: { id: classStream.id, name: classStream.name },
      term: term || 'term1',
      academicYear: academicYear || new Date().getFullYear().toString(),
      students: studentResults,
    });
  } catch (error) {
    console.error('Class report error:', error.message);
    res.status(500).json({ error: 'Failed to generate class report' });
  }
};

const getStudentReportPdf = async (req, res) => {
  try {
    const { term, academicYear } = req.query;
    const { studentId } = req.params;

    const studentResult = await getItem('students', studentId, {
      fields: '*,classStreamId.*',
    });
    if (!studentResult.data) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.data;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = student.classStreamId?.id || student.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only view reports for your class' });
      }
    }

    const filter = { 'filter[studentId][_eq]': studentId };
    if (term) filter['filter[term][_eq]'] = term;
    if (academicYear) filter['filter[academicYear][_eq]'] = academicYear;

    const assessmentsResult = await getItems('assessments', {
      fields: '*,subjectId.*',
      ...filter,
    });
    const assessments = assessmentsResult.data || [];
    const scales = await getGradingScales();

    const subjectMap = new Map();
    assessments.forEach((a) => {
      if (!subjectMap.has(a.subjectId)) subjectMap.set(a.subjectId, { name: a.subjectId?.name || 'Unknown', exam: 0, ca: 0 });
      const entry = subjectMap.get(a.subjectId);
      if (a.type === 'exam') entry.exam = a.score;
      else entry.ca = a.score;
    });

    const subjects = Array.from(subjectMap.entries()).map(([, data]) => {
      const total = data.exam + data.ca;
      const grade = determineGrade(total, 100, scales);
      return {
        name: data.name,
        examScore: data.exam,
        caScore: data.ca,
        total,
        grade: grade.grade,
        gradePoint: grade.gradePoint,
        position: 0,
      };
    });

    const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
    const average = subjects.length > 0 ? totalMarks / subjects.length : 0;

    const allFilter = { 'filter[term][_eq]': term || 'term1' };
    if (academicYear) allFilter['filter[academicYear][_eq]'] = academicYear;
    const allAssessmentsResult = await getItems('assessments', {
      fields: '*,studentId.*',
      ...allFilter,
    });
    const allAssessments = allAssessmentsResult.data || [];

    const studentClassId = student.classStreamId?.id || student.classStreamId;
    const classStudentIds = [...new Set(
      allAssessments
        .filter((a) => {
          const sid = a.studentId?.classStreamId?.id || a.studentId?.classStreamId;
          return sid === studentClassId;
        })
        .map((a) => a.studentId?.id || a.studentId)
    )];

    const totalsMap = new Map();
    classStudentIds.forEach((sid) => {
      const sAssessments = allAssessments.filter((a) => (a.studentId?.id || a.studentId) === sid);
      const subMap = new Map();
      sAssessments.forEach((a) => {
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, { exam: 0, ca: 0 });
        const entry = subMap.get(a.subjectId);
        if (a.type === 'exam') entry.exam = a.score;
        else entry.ca = a.score;
      });
      totalsMap.set(sid, Array.from(subMap.values()).reduce((sum, s) => sum + s.exam + s.ca, 0));
    });

    const positions = calculatePosition(
      Array.from(totalsMap.entries()).map(([sid, total]) => ({ studentId: sid, total }))
    );

    generateReportCard({
      studentName: `${student.firstName} ${student.lastName}`,
      admissionNumber: student.admissionNumber,
      className: student.classStreamId?.name || 'N/A',
      term: term || 'term1',
      academicYear: academicYear || new Date().getFullYear().toString(),
      subjects,
      totals: {
        totalMarks,
        average,
        classPosition: positions.get(student.id) || 0,
        totalStudents: classStudentIds.length,
      },
    }, res);
  } catch (error) {
    console.error('Student PDF report error:', error.message);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

const getClassReportPdf = async (req, res) => {
  try {
    const { term, academicYear } = req.query;
    const { classStreamId } = req.params;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (!classIds.includes(classStreamId)) {
        return res.status(403).json({ error: 'You can only view reports for your assigned class' });
      }
    }

    const classResult = await getItem('class_streams', classStreamId);
    if (!classResult.data) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const classStream = classResult.data;

    const studentsResult = await getItems('students', {
      'filter[classStreamId][_eq]': classStreamId,
    });
    const students = studentsResult.data || [];

    const scales = await getGradingScales();

    const filter = { 'filter[term][_eq]': term || 'term1' };
    if (academicYear) filter['filter[academicYear][_eq]'] = academicYear;

    const allAssessmentsResult = await getItems('assessments', {
      fields: '*,subjectId.*,studentId.*',
      ...filter,
    });
    const allAssessments = allAssessmentsResult.data || [];

    const studentResults = students.map((student) => {
      const sAssessments = allAssessments.filter((a) => (a.studentId?.id || a.studentId) === student.id);
      const subMap = new Map();
      sAssessments.forEach((a) => {
        if (!subMap.has(a.subjectId)) subMap.set(a.subjectId, { name: a.subjectId?.name || 'Unknown', exam: 0, ca: 0 });
        const entry = subMap.get(a.subjectId);
        if (a.type === 'exam') entry.exam = a.score;
        else entry.ca = a.score;
      });

      const subjects = Array.from(subMap.entries()).map(([, data]) => {
        const total = data.exam + data.ca;
        const grade = determineGrade(total, 100, scales);
        return { name: data.name, total, grade: grade.grade };
      });

      const totalMarks = subjects.reduce((sum, s) => sum + s.total, 0);
      return {
        studentName: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        subjects,
        totalMarks,
        average: subjects.length > 0 ? totalMarks / subjects.length : 0,
        position: 0,
      };
    });

    const positions = calculatePosition(studentResults.map((s, i) => ({ studentId: i.toString(), total: s.totalMarks })));
    studentResults.forEach((s, i) => { s.position = positions.get(i.toString()) || 0; });
    studentResults.sort((a, b) => a.position - b.position);

    generateClassReport(
      classStream.name,
      term || 'term1',
      academicYear || new Date().getFullYear().toString(),
      studentResults,
      res
    );
  } catch (error) {
    console.error('Class PDF report error:', error.message);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
};

module.exports = {
  getGradingScales: getGradingScalesHandler,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  getStudentReport,
  getClassReport,
  getStudentReportPdf,
  getClassReportPdf,
};
