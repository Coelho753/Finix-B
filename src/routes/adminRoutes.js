const express = require('express');
const { updateLoanPage, createPromotionCode } = require('../controllers/adminController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.put('/content/emprestimos', updateLoanPage);
router.post('/promotion-codes', createPromotionCode);

module.exports = router;
