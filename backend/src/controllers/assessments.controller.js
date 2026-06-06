// Assessments controller — CRUD for exam/CA scores with duplicate and role checks
const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

const getTeacherClassIds = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClasses' });
  const val = result.data?.assignedClasses;
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const list = async (req, res) => {
  try {
    const filter = {};
    if (req.query.studentId) filter.studentId = { _eq: req.query.studentId };
    if (req.query.subjectId) filter.subjectId = { _eq: req.query.subjectId };
    if (req.query.term) filter.term = { _eq: req.query.term };
    if (req.query.academicYear) filter.academicYear = { _eq: req.query.academicYear };
    if (req.query.type) filter.type = { _eq: req.query.type };

    const result = await getItems('assessments', {
      fields: '*,studentId.*,subjectId.*,studentId.classStreamId.*',
      sort: '-date_created',
      filter,
    });

    let assessments = result.data || [];

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      assessments = assessments.filter((a) => {
        const studentClassId = a.studentId?.classStreamId?.id || a.studentId?.classStreamId;
        return classIds.includes(studentClassId);
      });
    }

    if (req.query.classStreamId) {
      assessments = assessments.filter(
        (a) => (a.studentId?.classStreamId?.id || a.studentId?.classStreamId) === req.query.classStreamId
      );
    }

    assessments = assessments.map((a) => ({
      ...a,
      student: typeof a.studentId === 'object' ? a.studentId : undefined,
      subject: typeof a.subjectId === 'object' ? a.subjectId : undefined,
      studentId: typeof a.studentId === 'object' ? a.studentId.id : a.studentId,
      subjectId: typeof a.subjectId === 'object' ? a.subjectId.id : a.subjectId,
    }));

    res.json(assessments);
  } catch (error) {
    console.error('Assessments fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getItem('assessments', id, {
      fields: '*,studentId.*,subjectId.*',
    });
    if (!result.data) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = result.data.studentId?.classStreamId?.id || result.data.studentId?.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only view assessments for your class' });
      }
    }

    const item = result.data;
    item.student = typeof item.studentId === 'object' ? item.studentId : undefined;
    item.subject = typeof item.subjectId === 'object' ? item.subjectId : undefined;
    item.studentId = typeof item.studentId === 'object' ? item.studentId.id : item.studentId;
    item.subjectId = typeof item.subjectId === 'object' ? item.subjectId.id : item.subjectId;
    res.json(item);
  } catch (error) {
    console.error('Assessment fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch assessment details' });
  }
};

const create = async (req, res) => {
  try {
    const { studentId, subjectId, score, maxScore } = req.body;

    if (studentId) {
      const student = await getItem('students', studentId);
      if (!student.data) return res.status(404).json({ error: 'Student not found' });

      if (req.user.role !== 'admin') {
        const classIds = await getTeacherClassIds(req.user.id);
        const studentClassId = student.data.classStreamId?.id || student.data.classStreamId;
        if (!classIds.includes(studentClassId)) {
          return res.status(403).json({ error: 'You can only assess students in your class' });
        }
      }
    }

    if (subjectId) {
      const subject = await getItem('subjects', subjectId);
      if (!subject.data) return res.status(404).json({ error: 'Subject not found' });
    }

    if (studentId && subjectId && req.body.term && req.body.academicYear && req.body.type) {
      const existing = await getItems('assessments', {
        'filter[studentId][_eq]': studentId,
        'filter[subjectId][_eq]': subjectId,
        'filter[term][_eq]': req.body.term,
        'filter[academicYear][_eq]': req.body.academicYear,
        'filter[type][_eq]': req.body.type,
      });
      if (existing.data && existing.data.length > 0) {
        return res.status(409).json({ error: 'Duplicate assessment entry' });
      }
    }

    if (score !== undefined && maxScore !== undefined && (score < 0 || score > maxScore)) {
      return res.status(400).json({ error: 'Score exceeds max score' });
    }

    const newItem = await createItem('assessments', req.body);
    res.status(201).json(newItem.data);
  } catch (error) {
    console.error('Assessment create error:', error.message);
    res.status(500).json({ error: 'Failed to create assessment' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const existing = await getItem('assessments', id, { fields: '*,studentId.*' });
      if (!existing.data) return res.status(404).json({ error: 'Assessment not found' });
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = existing.data.studentId?.classStreamId?.id || existing.data.studentId?.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only update assessments for your class' });
      }
    }

    const updated = await updateItem('assessments', id, req.body);
    res.json(updated.data);
  } catch (error) {
    console.error('Assessment update error:', error.message);
    res.status(500).json({ error: 'Failed to update assessment' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const existing = await getItem('assessments', id, { fields: '*,studentId.*' });
      if (!existing.data) return res.status(404).json({ error: 'Assessment not found' });
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = existing.data.studentId?.classStreamId?.id || existing.data.studentId?.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only delete assessments for your class' });
      }
    }

    await deleteItem('assessments', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Assessment delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete assessment' });
  }
};

module.exports = { list, getById, create, update, remove };
