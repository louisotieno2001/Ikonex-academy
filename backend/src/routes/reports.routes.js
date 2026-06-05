const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  getGradingScales,
  createGradingScale,
  updateGradingScale,
  deleteGradingScale,
  getStudentReport,
  getClassReport,
  getStudentReportPdf,
  getClassReportPdf,
} = require('../controllers/reports.controller');

router.get('/grading-scales', authenticate, getGradingScales);
router.post('/grading-scales', authenticate, createGradingScale);
router.put('/grading-scales/:id', authenticate, updateGradingScale);
router.delete('/grading-scales/:id', authenticate, deleteGradingScale);
router.get('/student/:studentId', authenticate, getStudentReport);
router.get('/class/:classStreamId', authenticate, getClassReport);
router.get('/student/:studentId/pdf', authenticate, getStudentReportPdf);
router.get('/class/:classStreamId/pdf', authenticate, getClassReportPdf);

module.exports = router;
