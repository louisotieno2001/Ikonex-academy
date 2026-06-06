// System controller — status endpoint, log writer, filtered log viewer
const { getItems, getItem, createItem } = require('../services/directus.service');
const { query } = require('../services/directus.service');
const config = require('../config');

const writeLog = async ({ action, description, level = 'info', userId = null }) => {
  try {
    await createItem('system_logs', {
      action,
      description,
      level,
      userId,
    });
  } catch (error) {
    console.error('Failed to write system log:', error.message);
  }
};

const getStatus = async (req, res) => {
  try {
    let directusStatus = 'disconnected';
    try {
      await query('GET', '/server/ping');
      directusStatus = 'connected';
    } catch {
      directusStatus = 'error';
    }

    const startTime = process.uptime();
    const days = Math.floor(startTime / 86400);
    const hours = Math.floor((startTime % 86400) / 3600);
    const minutes = Math.floor((startTime % 3600) / 60);

    const [usersRes, studentsRes, classesRes, logsRes] = await Promise.allSettled([
      getItems('users', { fields: 'id,role,date_created', limit: 1, 'aggregate[count]': 'id' }),
      getItems('students', { fields: 'id', limit: 1, 'aggregate[count]': 'id' }),
      getItems('class_streams', { fields: 'id', limit: 1, 'aggregate[count]': 'id' }),
      getItems('system_logs', { fields: 'id,level', limit: 1, 'aggregate[count]': 'id' }),
    ]);

    const getCount = (result) => {
      if (result.status === 'fulfilled' && result.value.data?.[0]) {
        return parseInt(Object.values(result.value.data[0])[0], 10) || 0;
      }
      return 0;
    };

    const userCount = getCount(usersRes);
    const studentCount = getCount(studentsRes);
    const classCount = getCount(classesRes);
    const logCount = getCount(logsRes);

    let pendingCount = 0;
    try {
      const pending = await getItems('users', {
        fields: 'id',
        'filter[role][_eq]': 'pending',
        'aggregate[count]': 'id',
      });
      if (pending.data?.[0]) {
        pendingCount = parseInt(Object.values(pending.data[0])[0], 10) || 0;
      }
    } catch {}

    let recentSignups = [];
    try {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const signups = await getItems('users', {
        fields: 'id,firstName,lastName,email,role,date_created',
        sort: '-date_created',
        limit: 5,
        'filter[date_created][_gte]': weekAgo,
      });
      recentSignups = (signups.data || []).map((u) => ({
        id: u.id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: u.role,
        date: u.date_created,
      }));
    } catch {}

    res.json({
      directus: directusStatus,
      uptime: { days, hours, minutes, totalSeconds: Math.floor(startTime) },
      counts: { users: userCount, students: studentCount, classes: classCount, logs: logCount },
      pendingUsers: pendingCount,
      recentSignups,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('System status error:', error.message);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
};

const getLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const level = req.query.level;
    const action = req.query.action;

    const params = {
      fields: '*',
      sort: '-date_created',
      limit,
    };

    if (level) {
      params['filter[level][_eq]'] = level;
    }
    if (action) {
      params['filter[action][_eq]'] = action;
    }

    const result = await getItems('system_logs', params);
    const logs = (result.data || []).map((log) => ({
      id: log.id,
      action: log.action,
      description: log.description,
      level: log.level,
      userId: log.userId,
      timestamp: log.date_created,
    }));

    res.json(logs);
  } catch (error) {
    console.error('System logs fetch error:', error.message);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
};

module.exports = { getStatus, getLogs, writeLog };