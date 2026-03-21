const express = require('express');
const {
  createPaymentNotification,
  listPaymentNotifications,
  updatePaymentNotification,
  deletePaymentNotification,
} = require('../controllers/paymentNotificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createPaymentNotification);
router.get('/', requireAuth, listPaymentNotifications);
router.put('/:id', requireAuth, updatePaymentNotification);
router.delete('/:id', requireAuth, deletePaymentNotification);

module.exports = router;
