const express = require('express');
const {
  getFunds,
  updateFunds,
  getFinanceDashboard,
  getFinanceHistory,
  getMyFinancialSummary,
} = require('../controllers/financeController');

const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// 🔥 ADMIN ONLY
router.get('/fund-data', requireAuth, requireRole('admin'), getFunds);
router.put('/fund-data', requireAuth, requireRole('admin'), updateFunds);
router.get('/dashboard', requireAuth, requireRole('admin'), getFinanceDashboard);
router.get('/history', requireAuth, requireRole('admin'), getFinanceHistory);

// 🔥 QUALQUER LOGADO
router.get('/my-summary', requireAuth, getMyFinancialSummary);

module.exports = router;