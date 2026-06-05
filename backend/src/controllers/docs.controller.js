const { query } = require('../services/directus.service');

const getIndex = async (req, res) => {
  let directus = 'checking', uptime = null, counts = null;
  try {
    const start = Date.now();
    await query('GET', '/server/info');
    uptime = Math.floor((Date.now() - start) / 1000);
    const usersRes = await query('GET', '/items/directus_users', null, { limit: 1 });
    const studentsRes = await query('GET', '/items/students', null, { limit: 1, aggregate: { count: 'id' } });
    directus = 'connected';
    counts = {
      users: usersRes.data?.length || 0,
      students: studentsRes.data?.[0]?.count?.id || 0,
    };
  } catch {
    directus = 'disconnected';
  }

  res.render('index', { title: 'Dashboard', currentPage: 'index', directus, uptime, counts });
};

const getDocs = (req, res) => {
  res.render('docs', { title: 'Documentation', currentPage: 'docs' });
};

module.exports = { getIndex, getDocs };
