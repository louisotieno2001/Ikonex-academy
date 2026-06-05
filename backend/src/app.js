require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const config = require('./config');

const authRoutes = require('./routes/auth.routes');
const classStreamRoutes = require('./routes/classStreams.routes');
const studentRoutes = require('./routes/students.routes');
const subjectRoutes = require('./routes/subjects.routes');
const assessmentRoutes = require('./routes/assessments.routes');
const reportRoutes = require('./routes/reports.routes');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

app.set('trust proxy', 1);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Ikonex Academy API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/class-streams', classStreamRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/reports', reportRoutes);

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
