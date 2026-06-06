// System routes — health status (authenticated) and audit logs (admin only)
const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getStatus, getLogs } = require('../controllers/system.controller');

const router = Router();

router.get('/status', authenticate, getStatus);
router.get('/logs', authenticate, authorize('admin'), getLogs);

module.exports = router;