// Attendance routes — list, mark, date list, and stats endpoints
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { list, mark, getDates, stats } = require('../controllers/attendance.controller');

router.get('/', authenticate, list);
router.get('/dates', authenticate, getDates);
router.get('/stats', authenticate, stats);
router.post('/mark', authenticate, mark);

module.exports = router;
