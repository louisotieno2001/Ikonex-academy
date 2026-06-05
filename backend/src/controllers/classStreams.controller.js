const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

const getTeacherClassIds = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClasses' });
  const val = result.data?.assignedClasses;
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

const normalizeClassStudent = (s) => ({
  id: s.id,
  admissionNumber: s.admissionNumber,
  firstName: s.firstName,
  lastName: s.lastName,
  gender: s.gender,
  dateOfBirth: s.dateOfBirth,
  address: s.address || '',
  phoneNumber: s.phoneNumber || '',
  parentName: s.parentName || '',
  parentPhone: s.parentPhone || '',
  parentEmail: s.parentEmail || '',
  medicalInfo: s.medicalInfo || '',
  classStreamId: (typeof s.classStreamId === 'object' ? s.classStreamId?.id : s.classStreamId) || null,
  enrollmentDate: s.enrollmentDate,
  isActive: s.isActive,
  status: s.status || 'active',
});

const normalizeClassStream = (c, studentCount) => ({
  id: c.id,
  name: c.name,
  code: c.code,
  description: c.description || '',
  isActive: c.isActive,
  students: c.students ? c.students.map(normalizeClassStudent) : [],
  studentCount: typeof studentCount === 'number' ? studentCount : (c.students?.length || 0),
  classSubjects: c.classSubjects || [],
  createdAt: c.date_created,
});

const list = async (req, res) => {
  try {
    let classes;
    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (classIds.length === 0) return res.json([]);
      const result = await getItems('class_streams', {
        fields: '*',
        sort: 'name',
        'filter[id][_in]': classIds.join(','),
      });
      classes = result.data || [];
    } else {
      const result = await getItems('class_streams', {
        fields: '*',
        sort: 'name',
      });
      classes = result.data || [];
    }

    const studentsResult = await getItems('students', {
      fields: 'id,classStreamId',
    });
    const allStudents = studentsResult.data || [];
    const countByClass = {};
    allStudents.forEach((s) => {
      const cid = typeof s.classStreamId === 'object' ? s.classStreamId?.id : s.classStreamId;
      if (cid) countByClass[cid] = (countByClass[cid] || 0) + 1;
    });

    const normalized = classes.map((c) => normalizeClassStream(c, countByClass[c.id] || 0));
    res.json(normalized);
  } catch (error) {
    console.error('Class streams fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch class streams' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (!classIds.includes(id)) {
        return res.status(403).json({ error: 'You can only view your assigned class' });
      }
    }

    const result = await getItem('class_streams', id, {
      fields: '*,classSubjects.*,classSubjects.subjectId.*',
    });
    if (!result.data) {
      return res.status(404).json({ error: 'Class stream not found' });
    }

    const studentsResult = await getItems('students', {
      fields: '*,classStreamId.*',
      'filter[classStreamId][_eq]': id,
      sort: 'lastName,firstName',
    });

    const raw = result.data;
    raw.students = (studentsResult.data || []).map(normalizeClassStudent);
    res.json(normalizeClassStream(raw, raw.students.length));
  } catch (error) {
    console.error('Class stream fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch class stream details' });
  }
};

const create = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create class streams' });
  }
  try {
    const { code } = req.body;
    if (code) {
      const existing = await getItems('class_streams', { 'filter[code][_eq]': code });
      if (existing.data && existing.data.length > 0) {
        return res.status(409).json({ error: 'Class code already exists' });
      }
    }
    const newItem = await createItem('class_streams', req.body);
    res.status(201).json(newItem.data);
  } catch (error) {
    console.error('Class stream create error:', error.message);
    res.status(500).json({ error: 'Failed to create class stream' });
  }
};

const update = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update class streams' });
  }
  try {
    const { id } = req.params;
    const updated = await updateItem('class_streams', id, req.body);
    res.json(updated.data);
  } catch (error) {
    console.error('Class stream update error:', error.message);
    res.status(500).json({ error: 'Failed to update class stream' });
  }
};

const remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete class streams' });
  }
  try {
    const { id } = req.params;
    await deleteItem('class_streams', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Class stream delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete class stream' });
  }
};

const assignTeacher = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can assign teachers' });
  }
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    const classResult = await getItem('class_streams', id);
    if (!classResult.data) {
      return res.status(404).json({ error: 'Class stream not found' });
    }

    const userResult = await getItem('users', teacherId);
    if (!userResult.data) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = await getItem('users', teacherId, { fields: 'assignedClasses' });
    const existingClasses = user.data?.assignedClasses || [];
    const updatedClasses = Array.isArray(existingClasses)
      ? [...new Set([...existingClasses, id])]
      : [existingClasses, id].filter(Boolean);
    await updateItem('users', teacherId, { assignedClasses: updatedClasses, role: 'teacher', suspend: false });
    res.json({ success: true, message: 'Teacher assigned to class' });
  } catch (error) {
    console.error('Assign teacher error:', error.message);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
};

module.exports = { list, getById, create, update, remove, assignTeacher };
