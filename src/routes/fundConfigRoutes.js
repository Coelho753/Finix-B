const express = require('express');
const { getFundConfig, updateFundConfig } = require('../controllers/fundConfigController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getFundConfig);
router.put('/', requireAuth, updateFundConfig);

module.exports = router;
