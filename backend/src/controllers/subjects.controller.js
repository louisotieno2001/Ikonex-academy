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
      const classSubjects = await getItems('class_subjects', {
        fields: '*,subjectId.*',
        'filter[classStreamId][_eq]': classId,
      });
      const subjects = (classSubjects.data || []).map((cs) => cs.subjectId).filter(Boolean);
      return res.json(subjects);
    }
    const result = await getItems('subjects', { sort: 'name' });
    res.json(result.data || []);
  } catch (error) {
    console.error('Subjects fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getItem('subjects', id, {
      fields: '*,classSubjects.*,classSubjects.classStreamId.*',
    });
    if (!result.data) {
      return res.status(404).json({ error: 'Subject not found' });
    }

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      const hasAccess = (result.data.classSubjects || []).some(
        (cs) => (cs.classStreamId?.id || cs.classStreamId) === classId
      );
      if (!hasAccess) {
        return res.status(403).json({ error: 'You can only view subjects assigned to your class' });
      }
    }

    res.json(result.data);
  } catch (error) {
    console.error('Subject fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subject details' });
  }
};

const create = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can create subjects' });
  }
  try {
    const { code } = req.body;
    if (code) {
      const existing = await getItems('subjects', { 'filter[code][_eq]': code });
      if (existing.data && existing.data.length > 0) {
        return res.status(409).json({ error: 'Subject code already exists' });
      }
    }
    const newItem = await createItem('subjects', req.body);
    res.status(201).json(newItem.data);
  } catch (error) {
    console.error('Subject create error:', error.message);
    res.status(500).json({ error: 'Failed to create subject' });
  }
};

const update = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update subjects' });
  }
  try {
    const { id } = req.params;
    const updated = await updateItem('subjects', id, req.body);
    res.json(updated.data);
  } catch (error) {
    console.error('Subject update error:', error.message);
    res.status(500).json({ error: 'Failed to update subject' });
  }
};

const remove = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can delete subjects' });
  }
  try {
    const { id } = req.params;
    await deleteItem('subjects', id);
    res.json({ success: true });
  } catch (error) {
    console.error('Subject delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
};

const assign = async (req, res) => {
  try {
    const { classStreamId, subjectIds } = req.body;

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (classId !== classStreamId) {
        return res.status(403).json({ error: 'You can only assign subjects to your class' });
      }
    }

    if (classStreamId) {
      const cs = await getItem('class_streams', classStreamId);
      if (!cs.data) return res.status(404).json({ error: 'Class stream not found' });
    }

    for (const subjectId of (subjectIds || [])) {
      const subject = await getItem('subjects', subjectId);
      if (!subject.data) return res.status(404).json({ error: `Subject ${subjectId} not found` });

      const existing = await getItems('class_subjects', {
        'filter[classStreamId][_eq]': classStreamId,
        'filter[subjectId][_eq]': subjectId,
      });
      if (!existing.data || existing.data.length === 0) {
        await createItem('class_subjects', { classStreamId, subjectId });
      }
    }

    const updated = await getItems('class_subjects', {
      fields: '*,subjectId.*',
      'filter[classStreamId][_eq]': classStreamId,
    });

    res.json(updated.data || []);
  } catch (error) {
    console.error('Subject assign error:', error.message);
    res.status(500).json({ error: 'Failed to assign subjects' });
  }
};

const unassign = async (req, res) => {
  try {
    const { classStreamId, subjectId } = req.params;

    if (req.user.role !== 'admin') {
      const classId = await getTeacherClassId(req.user.id);
      if (classId !== classStreamId) {
        return res.status(403).json({ error: 'You can only unassign subjects from your class' });
      }
    }

    const existing = await getItems('class_subjects', {
      'filter[classStreamId][_eq]': classStreamId,
      'filter[subjectId][_eq]': subjectId,
    });

    if (!existing.data || existing.data.length === 0) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    await deleteItem('class_subjects', existing.data[0].id);
    res.json({ success: true });
  } catch (error) {
    console.error('Subject unassign error:', error.message);
    res.status(500).json({ error: 'Failed to unassign subject' });
  }
};

module.exports = { list, getById, create, update, remove, assign, unassign };
