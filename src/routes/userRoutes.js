const express = require('express');
const { listUsers, listSocios } = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/socios', requireAuth, listSocios);
router.get('/', requireAuth, listUsers);

module.exports = router;
