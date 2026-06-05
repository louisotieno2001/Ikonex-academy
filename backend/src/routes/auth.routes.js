const express = require('express');
const router = express.Router();
const {
  login, register, refresh, me, updateMe, deleteMe,
  listUsers, updateUserRole, toggleSuspendUser, deleteUser,
} = require('../controllers/auth.controller');
const { authenticate, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, updateMe);
router.delete('/me', authenticate, deleteMe);

router.get('/users', ...requireRole('admin'), listUsers);
router.patch('/users/:id/role', ...requireRole('admin'), updateUserRole);
router.patch('/users/:id/suspend', ...requireRole('admin'), toggleSuspendUser);
router.delete('/users/:id', ...requireRole('admin'), deleteUser);

module.exports = router;
