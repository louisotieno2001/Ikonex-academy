const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

const getTeacherClassId = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClassId' });
  return result.data?.assignedClassId || null;
};

const checkTeacherAccess = async (userId, classStreamId) => {
  if (userId.split('_')[0] === 'admin') return true;
  const classId = await getTeacherClassId(userId);
  return classId === classStreamId;
};

const normalizeStudent = (item) => ({
  id: item.id,
  admissionNumber: item.admissionNumber,
  firstName: item.firstName,
  lastName: item.lastName,
  gender: item.gender,
  dateOfBirth: item.dateOfBirth,
  address: item.address || '',
  phoneNumber: item.phoneNumber || '',
  parentName: item.parentName || '',
  parentPhone: item.parentPhone || '',
  parentEmail: item.parentEmail || '',
  medicalInfo: item.medicalInfo || '',
  classStreamId: (typeof item.classStreamId === 'object' ? item.classStreamId?.id : item.classStreamId) || null,
  className: item.classStreamId?.name || item.class_name || '',
  enrollmentDate: item.enrollmentDate,
  isActive: item.isActive,
  status: item.status || 'active',
  createdAt: item.date_created,
});

const list = async (req, res) => {
  try {
    let filter = {};
    if (req.query.classStreamId) {
      filter.classStreamId = { _eq: req.query.classStreamId };
    }

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (!classId) return res.json([]);
      filter.classStreamId = { _eq: classId };
    }

    const result = await getItems('students', {
      fields: '*,classStreamId.*',
      sort: 'lastName,firstName',
      filter,
    });
    const students = (result.data || []).map(normalizeStudent);
    res.json(students);
  } catch (error) {
    console.error('Students fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getItem('students', id, {
      fields: '*,classStreamId.*,assessments.*,assessments.subjectId.*',
    });
    if (!result.data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      const studentClassId = result.data.classStreamId?.id || result.data.classStreamId;
      if (classId !== studentClassId) {
        return res.status(403).json({ error: 'You can only view students in your assigned class' });
      }
    }

    res.json(normalizeStudent(result.data));
  } catch (error) {
    console.error('Student fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch student details' });
  }
};

const create = async (req, res) => {
  try {
    const { admissionNumber, classStreamId } = req.body;
    const targetClassId = classStreamId || (req.user.role !== 'admin' ? await getTeacherClassId(req.user.id) : null);

    if (!targetClassId && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'You are not assigned to any class' });
    }

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (targetClassId !== classId) {
        return res.status(403).json({ error: 'You can only add students to your assigned class' });
      }
    }

    if (admissionNumber) {
      const existing = await getItems('students', {
        'filter[admissionNumber][_eq]': admissionNumber,
      });
      if (existing.data && existing.data.length > 0) {
        return res.status(409).json({ error: 'Admission number already exists' });
      }
    }

    if (targetClassId) {
      const cs = await getItem('class_streams', targetClassId);
      if (!cs.data) {
        return res.status(400).json({ error: 'Class stream not found' });
      }
    }

    const payload = { ...req.body, classStreamId: targetClassId };
    const newItem = await createItem('students', payload);
    res.status(201).json(newItem.data);
  } catch (error) {
    console.error('Student create error:', error.message);
    res.status(500).json({ error: 'Failed to create student' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const existing = await getItem('students', id, { fields: 'classStreamId' });
      if (!existing.data) return res.status(404).json({ error: 'Student not found' });
      const classId = await getTeacherClassId(req.user.id);
      const studentClassId = existing.data.classStreamId?.id || existing.data.classStreamId;
      if (classId !== studentClassId) {
        return res.status(403).json({ error: 'You can only update students in your assigned class' });
      }
    }

    const payload = { ...req.body };
    if (payload.classStreamId && typeof payload.classStreamId === 'object') {
      payload.classStreamId = payload.classStreamId.id;
    }

    const updated = await updateItem('students', id, payload);
    res.json(updated.data);
  } catch (error) {
    console.error('Student update error:', error.message);
    res.status(500).json({ error: 'Failed to update student' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const existing = await getItem('students', id, { fields: 'classStreamId' });
      if (!existing.data) return res.status(404).json({ error: 'Student not found' });
      const classId = await getTeacherClassId(req.user.id);
      const studentClassId = existing.data.classStreamId?.id || existing.data.classStreamId;
      if (classId !== studentClassId) {
        return res.status(403).json({ error: 'You can only delete students in your assigned class' });
      }
    }

    await deleteItem('students', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Student delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

module.exports = { list, getById, create, update, remove };
