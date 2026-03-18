const express = require('express');
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  promoteToSocio,
} = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/promote-to-socio', requireAuth, promoteToSocio);

module.exports = router;
