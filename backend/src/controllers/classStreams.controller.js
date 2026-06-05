const { getItems, getItem, createItem, updateItem, deleteItem } = require('../services/directus.service');

const getTeacherClassId = async (userId) => {
  const result = await getItem('users', userId, { fields: 'assignedClassId' });
  return result.data?.assignedClassId || null;
};

const list = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (!classId) return res.json([]);
      const result = await getItem('class_streams', classId, {
        fields: '*,students.*',
      });
      return res.json(result.data ? [result.data] : []);
    }

    const result = await getItems('class_streams', {
      fields: '*,students.*',
      sort: 'name',
    });
    res.json(result.data || []);
  } catch (error) {
    console.error('Class streams fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch class streams' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (classId !== id) {
        return res.status(403).json({ error: 'You can only view your assigned class' });
      }
    }

    const result = await getItem('class_streams', id, {
      fields: '*,students.*,classSubjects.*,classSubjects.subjectId.*',
    });
    if (!result.data) {
      return res.status(404).json({ error: 'Class stream not found' });
    }
    res.json(result.data);
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

    await updateItem('users', teacherId, { assignedClassId: id, role: 'teacher', suspend: false });
    res.json({ success: true, message: 'Teacher assigned to class' });
  } catch (error) {
    console.error('Assign teacher error:', error.message);
    res.status(500).json({ error: 'Failed to assign teacher' });
  }
};

module.exports = { list, getById, create, update, remove, assignTeacher };
