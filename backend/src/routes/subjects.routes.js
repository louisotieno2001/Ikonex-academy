const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { list, getById, create, update, remove, assign, unassign } = require('../controllers/subjects.controller');

router.get('/', authenticate, list);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);
router.post('/assign', authenticate, assign);
router.delete('/assign/:classStreamId/:subjectId', authenticate, unassign);

module.exports = router;
