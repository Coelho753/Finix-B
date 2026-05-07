const mongoose = require('mongoose');
const PaymentNotification = require('../models/PaymentNotification');
const User = require('../models/User');
const { sanitizeInput } = require('../services/authService');

async function resolveNotificationUser(req) {
  const requestedUserId =
    req.user.role === 'admin'
      ? req.body?.user_id || req.body?.userId || req.body?.socio_id || req.body?.socioId || req.user._id
      : req.user._id;

  if (!mongoose.isValidObjectId(requestedUserId)) {
    return { error: 'Usuário inválido para a notificação' };
  }

  const user = await User.findById(requestedUserId).select('name role');
  if (!user) {
    return { error: 'Usuário da notificação não encontrado' };
  }

  if (user.role !== 'socio') {
    return { error: 'Notificações de pagamento são permitidas apenas para sócios' };
  }

  return { user };
}

async function createPaymentNotification(req, res) {
  const mesReferencia = sanitizeInput(req.body?.mes_referencia);
  const mensagem = sanitizeInput(req.body?.mensagem);
  const comprovanteUrl = sanitizeInput(req.body?.comprovante_url);
  const valor = Number(req.body?.valor);
  const parcelaNumero = req.body?.parcela_numero !== undefined ? Number(req.body.parcela_numero) : undefined;
  const transactionId = sanitizeInput(req.body?.transaction_id);

  if (!mesReferencia || !Number.isFinite(valor) || valor <= 0) {
    return res.status(400).json({ message: 'Mês de referência e valor válido são obrigatórios' });
  }

  const { user, error } = await resolveNotificationUser(req);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const notification = await PaymentNotification.create({
    user_id: user._id,
    user_name: user.name,
    mes_referencia: mesReferencia,
    valor,
    mensagem,
    comprovante_url: comprovanteUrl,
    transaction_id: transactionId || undefined,
    parcela_numero: Number.isFinite(parcelaNumero) ? parcelaNumero : undefined,
  });

  return res.status(201).json(notification);
}

async function listPaymentNotifications(req, res) {
  const query = req.user.role === 'admin' ? {} : { user_id: req.user._id };
  const notifications = await PaymentNotification.find(query).sort({ created_at: -1 });
  return res.json(notifications);
}

async function updatePaymentNotification(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const status = sanitizeInput(req.body?.status);
  if (!['confirmado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const notification = await PaymentNotification.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!notification) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }

  return res.json(notification);
}

async function deletePaymentNotification(req, res) {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
  const notification = await PaymentNotification.findOneAndDelete(filter);

  if (!notification) {
    return res.status(404).json({ message: 'Notificação não encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createPaymentNotification,
  listPaymentNotifications,
  updatePaymentNotification,
  deletePaymentNotification,
};
