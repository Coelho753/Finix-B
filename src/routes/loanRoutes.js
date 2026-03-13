const express = require('express');
const { requestLoan, getLoanReport } = require('../controllers/loanController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, requestLoan);
router.get('/report', requireAuth, requireRole('admin'), getLoanReport);

module.exports = router;
