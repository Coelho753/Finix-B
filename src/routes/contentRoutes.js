const express = require('express');
const { getLoanPage } = require('../controllers/contentController');

const router = express.Router();
router.get('/emprestimos', getLoanPage);

module.exports = router;
