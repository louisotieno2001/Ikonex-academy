const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

const getTeacherClassIds = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClasses' });
  const val = result.data?.assignedClasses;
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const checkTeacherAccess = async (userId, classStreamId) => {
  if (userId.split('_')[0] === 'admin') return true;
  const classIds = await getTeacherClassIds(userId);
  return classIds.includes(classStreamId);
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
  classStream: typeof item.classStreamId === 'object' ? item.classStreamId : null,
  enrollmentDate: item.enrollmentDate,
  isActive: item.isActive,
  status: item.status || 'active',
  createdAt: item.date_created,
});

const list = async (req, res) => {
  try {
    let filter = {};
    const requestedClassId = req.query.classStreamId;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (classIds.length === 0) return res.json([]);
      const allowed = requestedClassId
        ? classIds.filter((id) => id === requestedClassId)
        : classIds;
      if (allowed.length === 0) return res.json([]);
      filter.classStreamId = { _in: allowed.join(',') };
    } else if (requestedClassId) {
      filter.classStreamId = { _eq: requestedClassId };
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
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = result.data.classStreamId?.id || result.data.classStreamId;
      if (!classIds.includes(studentClassId)) {
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
    const targetClassId = classStreamId || (req.user.role !== 'admin' ? (await getTeacherClassIds(req.user.id))[0] : null);

    if (!targetClassId && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'You are not assigned to any class' });
    }

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (!classIds.includes(targetClassId)) {
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
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = existing.data.classStreamId?.id || existing.data.classStreamId;
      if (!classIds.includes(studentClassId)) {
        return res.status(403).json({ error: 'You can only update students in your assigned class' });
      }
    }

    const payload = { ...req.body };
    if (payload.classStreamId && typeof payload.classStreamId === 'object') {
      payload.classStreamId = payload.classStreamId.id;
    }

    const updated = await updateItem('students', id, payload);
    const refetched = await getItem('students', id, { fields: '*,classStreamId.*' });
    res.json(normalizeStudent(refetched.data || updated.data));
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
      const classIds = await getTeacherClassIds(req.user.id);
      const studentClassId = existing.data.classStreamId?.id || existing.data.classStreamId;
      if (!classIds.includes(studentClassId)) {
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
