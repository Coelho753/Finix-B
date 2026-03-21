const express = require('express');
const {
  getFunds,
  updateFunds,
  getFinanceDashboard,
  getMyFinancialSummary,
} = require('../controllers/financeController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/fund-data', requireAuth, getFunds);
router.put('/fund-data', requireAuth, updateFunds);
router.get('/dashboard', requireAuth, getFinanceDashboard);
router.get('/my-summary', requireAuth, getMyFinancialSummary);

module.exports = router;
