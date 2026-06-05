const express = require('express');
const router = express.Router();
const { getIndex, getDocs } = require('../controllers/docs.controller');

router.get('/', getIndex);
router.get('/docs', getDocs);

module.exports = router;
