// Students routes — CRUD endpoints for student records
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { list, getById, create, update, remove } = require('../controllers/students.controller');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
