const express = require('express');
const { register, login, promoteToSocio } = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/promote-to-socio', requireAuth, promoteToSocio);

module.exports = router;
