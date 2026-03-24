const express = require('express');
const {
  listMembershipCodes,
  createMembershipCode,
  validateMembershipCode,
  useMembershipCode,
} = require('../controllers/membershipCodeController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, listMembershipCodes);
router.post('/', requireAuth, createMembershipCode);
router.get('/validate/:code', validateMembershipCode);
router.post('/use', requireAuth, useMembershipCode);

module.exports = router;
