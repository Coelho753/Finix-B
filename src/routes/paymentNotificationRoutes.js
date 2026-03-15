const express = require('express');
const {
  createPaymentNotification,
  listPaymentNotifications,
} = require('../controllers/paymentNotificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createPaymentNotification);
router.get('/', requireAuth, listPaymentNotifications);

module.exports = router;
