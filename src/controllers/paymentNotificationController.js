const PaymentNotification = require('../models/PaymentNotification');
const { sanitizeInput } = require('../services/authService');

async function createPaymentNotification(req, res) {
  const message = sanitizeInput(req.body?.message);
  const transactionId = sanitizeInput(req.body?.transactionId);

  if (!message) {
    return res.status(400).json({ message: 'Mensagem é obrigatória' });
  }

  const notification = await PaymentNotification.create({
    userId: req.user?._id,
    transactionId,
    message,
  });

  return res.status(201).json(notification);
}

async function listPaymentNotifications(req, res) {
  const query = req.user?.role === 'admin' ? {} : { userId: req.user?._id };
  const notifications = await PaymentNotification.find(query).sort({ createdAt: -1 });
  return res.json(notifications);
}

module.exports = {
  createPaymentNotification,
  listPaymentNotifications,
};
