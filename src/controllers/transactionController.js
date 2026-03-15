const Transaction = require('../models/Transaction');
const { sanitizeInput } = require('../services/authService');

async function createTransaction(req, res) {
  const type = sanitizeInput(req.body?.type);
  const description = sanitizeInput(req.body?.description);
  const status = sanitizeInput(req.body?.status) || 'pending';
  const amount = Number(req.body?.amount);
  const date = req.body?.date ? new Date(req.body.date) : undefined;

  if (!type || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Tipo e valor válido são obrigatórios' });
  }

  const transaction = await Transaction.create({
    userId: req.user._id,
    type,
    amount,
    description,
    status,
    date: date && !Number.isNaN(date.getTime()) ? date : undefined,
  });

  return res.status(201).json(transaction);
}

async function listTransactions(req, res) {
  const query = req.user.role === 'admin' ? {} : { userId: req.user._id };
  const transactions = await Transaction.find(query).sort({ createdAt: -1 });
  return res.json(transactions);
}

async function updateTransaction(req, res) {
  const updates = {};

  if (req.body?.type !== undefined) updates.type = sanitizeInput(req.body.type);
  if (req.body?.description !== undefined) updates.description = sanitizeInput(req.body.description);
  if (req.body?.status !== undefined) updates.status = sanitizeInput(req.body.status);
  if (req.body?.amount !== undefined) {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valor inválido' });
    }
    updates.amount = amount;
  }
  if (req.body?.date !== undefined) {
    const date = new Date(req.body.date);
    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({ message: 'Data inválida' });
    }
    updates.date = date;
  }

  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, userId: req.user._id };

  const transaction = await Transaction.findOneAndUpdate(filter, updates, {
    new: true,
    runValidators: true,
  });

  if (!transaction) {
    return res.status(404).json({ message: 'Transação não encontrada' });
  }

  return res.json(transaction);
}

async function deleteTransaction(req, res) {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, userId: req.user._id };

  const transaction = await Transaction.findOneAndDelete(filter);
  if (!transaction) {
    return res.status(404).json({ message: 'Transação não encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createTransaction,
  listTransactions,
  updateTransaction,
  deleteTransaction,
};
