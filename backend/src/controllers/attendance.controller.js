// Attendance controller — list, mark (upsert), get dates, stats with teacher scoping
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
    if (req.query.classStreamId) filter.classStreamId = { _eq: req.query.classStreamId };
    if (req.query.date) filter.date = { _eq: req.query.date };
    if (req.query.term) filter.term = { _eq: req.query.term };
    if (req.query.academicYear) filter.academicYear = { _eq: req.query.academicYear };
    if (req.query.isLastDay) filter.isLastDay = { _eq: req.query.isLastDay };

    const result = await getItems('attendance', {
      fields: '*,studentId.*,classStreamId.*,markedBy.*',
      sort: '-date',
      filter,
    });

    let records = result.data || [];

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      records = records.filter((r) => {
        const cid = r.classStreamId?.id || r.classStreamId;
        return classIds.includes(cid);
      });
    }

    records = records.map((r) => ({
      ...r,
      student: typeof r.studentId === 'object' ? r.studentId : undefined,
      classStream: typeof r.classStreamId === 'object' ? r.classStreamId : undefined,
      marker: typeof r.markedBy === 'object' ? r.markedBy : undefined,
      studentId: typeof r.studentId === 'object' ? r.studentId.id : r.studentId,
      classStreamId: typeof r.classStreamId === 'object' ? r.classStreamId.id : r.classStreamId,
      markedBy: typeof r.markedBy === 'object' ? r.markedBy.id : r.markedBy,
    }));

    res.json(records);
  } catch (error) {
    console.error('Attendance fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
};

const mark = async (req, res) => {
  try {
    const { classStreamId, date, term, academicYear, records, isLastDay } = req.body;

    if (!classStreamId || !date || !term || !academicYear || !records) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      if (!classIds.includes(classStreamId)) {
        return res.status(403).json({ error: 'You can only mark attendance for your assigned class' });
      }
    }

    const results = [];
    for (const rec of records) {
      const existing = await getItems('attendance', {
        'filter[studentId][_eq]': rec.studentId,
        'filter[classStreamId][_eq]': classStreamId,
        'filter[date][_eq]': date,
        'filter[term][_eq]': term,
        'filter[academicYear][_eq]': academicYear,
        limit: 1,
      });

      const payload = {
        studentId: rec.studentId,
        classStreamId,
        date,
        status: rec.status,
        term,
        academicYear,
        markedBy: req.user.id,
        isLastDay: isLastDay || false,
      };

      if (existing.data && existing.data.length > 0) {
        const existingId = existing.data[0].id;
        const updated = await updateItem('attendance', existingId, payload);
        results.push(updated.data);
      } else {
        const created = await createItem('attendance', payload);
        results.push(created.data);
      }
    }

    const classStudentCount = await getItems('students', {
      'filter[classStreamId][_eq]': classStreamId,
    });

    res.json({
      success: true,
      marked: results.length,
      totalStudents: classStudentCount.data?.length || 0,
    });
  } catch (error) {
    console.error('Attendance mark error:', error.message);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};

const getDates = async (req, res) => {
  try {
    const filter = {};
    if (req.query.classStreamId) filter.classStreamId = { _eq: req.query.classStreamId };
    if (req.query.term) filter.term = { _eq: req.query.term };
    if (req.query.academicYear) filter.academicYear = { _eq: req.query.academicYear };

    const result = await getItems('attendance', {
      fields: 'date,isLastDay,classStreamId',
      sort: '-date',
      filter,
    });

    const records = result.data || [];
    const uniqueDates = [];
    const seen = new Set();
    records.forEach((r) => {
      if (!r.classStreamId) return;
      const cid = typeof r.classStreamId === 'object' ? (r.classStreamId.id || r.classStreamId) : r.classStreamId;
      const key = `${cid}|${r.date}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDates.push({
          classStreamId: cid,
          date: r.date,
          isLastDay: !!r.isLastDay,
        });
      }
    });

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      const filtered = uniqueDates.filter((d) => classIds.includes(d.classStreamId));
      return res.json(filtered);
    }

    res.json(uniqueDates);
  } catch (error) {
    console.error('Attendance dates fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance dates' });
  }
};

const stats = async (req, res) => {
  try {
    const { classStreamId, term, academicYear, studentId } = req.query;

    const filter = {};
    if (classStreamId) filter.classStreamId = { _eq: classStreamId };
    if (term) filter.term = { _eq: term };
    if (academicYear) filter.academicYear = { _eq: academicYear };
    if (studentId) filter.studentId = { _eq: studentId };

    const result = await getItems('attendance', {
      fields: 'status,studentId',
      filter,
    });

    let records = result.data || [];

    if (req.user.role !== 'admin') {
      const classIds = await getTeacherClassIds(req.user.id);
      records = records.filter((r) => {
        const cid = r.classStreamId?.id || r.classStreamId;
        return classIds.includes(cid);
      });
    }

    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({
      total,
      present,
      absent,
      percentage,
    });
  } catch (error) {
    console.error('Attendance stats error:', error.message);
    res.status(500).json({ error: 'Failed to get attendance stats' });
  }
};

module.exports = { list, mark, getDates, stats };
