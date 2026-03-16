const express = require('express');
const {
  createPaymentNotification,
  listPaymentNotifications,
  updatePaymentNotification,
} = require('../controllers/paymentNotificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createPaymentNotification);
router.get('/', requireAuth, listPaymentNotifications);
router.put('/:id', requireAuth, updatePaymentNotification);

module.exports = router;
