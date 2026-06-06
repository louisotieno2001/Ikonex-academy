// Express app entry — middleware, CORS, routes, error handling
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');

const path = require('path');
const authRoutes = require('./routes/auth.routes');
const classStreamRoutes = require('./routes/classStreams.routes');
const studentRoutes = require('./routes/students.routes');
const subjectRoutes = require('./routes/subjects.routes');
const assessmentRoutes = require('./routes/assessments.routes');
const reportRoutes = require('./routes/reports.routes');
const systemRoutes = require('./routes/system.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const docsRoutes = require('./routes/docs.routes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
// CORS configuration
console.log('CORS Origins allowed:', config.cors.origin);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || config.cors.origin.includes(origin)) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, X-Requested-With');
    res.setHeader('Vary', 'Origin');

    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ikonex Academy API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/class-streams', classStreamRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/attendance', attendanceRoutes);

app.use('/', docsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`Ikonex Academy API running on http://localhost:${config.port}`);
});
