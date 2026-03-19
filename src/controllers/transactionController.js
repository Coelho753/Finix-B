const Transaction = require('../models/Transaction');
const User = require('../models/User');
const FiadorRequest = require('../models/FiadorRequest');
const { sanitizeInput } = require('../services/authService');

function sanitizeParcelas(parcelas) {
  if (!Array.isArray(parcelas)) return [];

  return parcelas
    .map((parcela, index) => {
      const numero = Number(parcela?.numero ?? index + 1);
      const valor = Number(parcela?.valor);
      const paga = Boolean(parcela?.paga);
      const dataPagamento = parcela?.data_pagamento ? new Date(parcela.data_pagamento) : undefined;

      if (!Number.isFinite(numero) || numero <= 0 || !Number.isFinite(valor) || valor <= 0) {
        return null;
      }

      return {
        numero,
        valor,
        paga,
        data_pagamento: dataPagamento && !Number.isNaN(dataPagamento.getTime()) ? dataPagamento : undefined,
      };
    })
    .filter(Boolean);
}

async function resolveFiador(fiadorCode, existingFiadorNome) {
  if (!fiadorCode) {
    return { fiadorNome: existingFiadorNome, fiadorRequest: null };
  }

  const fiadorRequest = await FiadorRequest.findOne({
    fiador_code: fiadorCode,
    fiador_code_used: false,
    status: 'aprovado',
  });

  if (!fiadorRequest) {
    return { error: 'Código de fiador inválido ou já utilizado' };
  }

  return { fiadorNome: fiadorRequest.fiador_nome, fiadorRequest };
}

async function createTransaction(req, res) {
  const payload = {
    nome: sanitizeInput(req.body?.nome),
    email: sanitizeInput(req.body?.email || '').toLowerCase(),
    tipo: sanitizeInput(req.body?.tipo),
    fiador_nome: sanitizeInput(req.body?.fiador_nome),
    fiador_telefone: sanitizeInput(req.body?.fiador_telefone),
    fiador_code: sanitizeInput(req.body?.fiador_code),
    observacoes: sanitizeInput(req.body?.observacoes),
    status: sanitizeInput(req.body?.status) || 'ativo',
    valor_emprestimo: Number(req.body?.valor_emprestimo),
    taxa: Number(req.body?.taxa),
    valor_total: Number(req.body?.valor_total),
    quantidade_parcelas: Number(req.body?.quantidade_parcelas),
    data_emprestimo: new Date(req.body?.data_emprestimo),
    parcelas: sanitizeParcelas(req.body?.parcelas),
  };

  if (!payload.nome || !payload.email || !['socio', 'terceiro'].includes(payload.tipo)) {
    return res.status(400).json({ message: 'Dados obrigatórios inválidos' });
  }

  if (
    !Number.isFinite(payload.valor_emprestimo) ||
    !Number.isFinite(payload.taxa) ||
    !Number.isFinite(payload.valor_total) ||
    !Number.isFinite(payload.quantidade_parcelas) ||
    payload.valor_emprestimo <= 0 ||
    payload.valor_total <= 0 ||
    payload.quantidade_parcelas <= 0 ||
    Number.isNaN(payload.data_emprestimo.getTime())
  ) {
    return res.status(400).json({ message: 'Valores do empréstimo inválidos' });
  }

  const { fiadorNome, fiadorRequest, error } = await resolveFiador(payload.fiador_code, payload.fiador_nome);
  if (error) {
    return res.status(400).json({ message: error });
  }

  if (payload.tipo === 'terceiro' && !fiadorNome) {
    return res.status(400).json({ message: 'Fiador é obrigatório para terceiros' });
  }

  payload.fiador_nome = fiadorNome;

  const user = await User.findOne({ email: payload.email });
  const transaction = await Transaction.create({
    ...payload,
    user_id: user?._id,
  });

  if (fiadorRequest) {
    fiadorRequest.fiador_code_used = true;
    await fiadorRequest.save();
  }

  return res.status(201).json(transaction);
}

async function listTransactions(req, res) {
  const query = req.user.role === 'admin' ? {} : { user_id: req.user._id };
  const transactions = await Transaction.find(query).sort({ created_at: -1 });
  return res.json(transactions);
}

async function listMyTransactions(req, res) {
  const transactions = await Transaction.find({ user_id: req.user._id }).sort({ created_at: -1 });
  return res.json(transactions);
}

async function updateTransaction(req, res) {
  const updates = {};
  const allowed = [
    'nome',
    'email',
    'tipo',
    'fiador_nome',
    'fiador_telefone',
    'fiador_code',
    'observacoes',
    'status',
    'valor_emprestimo',
    'taxa',
    'valor_total',
    'quantidade_parcelas',
    'data_emprestimo',
    'parcelas',
  ];

  for (const key of allowed) {
    if (req.body?.[key] === undefined) continue;

    if (
      ['nome', 'email', 'tipo', 'fiador_nome', 'fiador_telefone', 'fiador_code', 'observacoes', 'status'].includes(
        key
      )
    ) {
      updates[key] = sanitizeInput(req.body[key]);
      if (key === 'email') updates.email = updates.email.toLowerCase();
    } else if (['valor_emprestimo', 'taxa', 'valor_total', 'quantidade_parcelas'].includes(key)) {
      updates[key] = Number(req.body[key]);
    } else if (key === 'data_emprestimo') {
      const d = new Date(req.body[key]);
      if (Number.isNaN(d.getTime())) return res.status(400).json({ message: 'Data inválida' });
      updates.data_emprestimo = d;
    } else if (key === 'parcelas') {
      updates.parcelas = sanitizeParcelas(req.body.parcelas);
    }
  }

  if (updates.email) {
    const user = await User.findOne({ email: updates.email });
    updates.user_id = user?._id;
  }

  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
  const transaction = await Transaction.findOneAndUpdate(filter, updates, { new: true, runValidators: true });

  if (!transaction) {
    return res.status(404).json({ message: 'Transação não encontrada' });
  }

  return res.json(transaction);
}

async function deleteTransaction(req, res) {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, user_id: req.user._id };
  const transaction = await Transaction.findOneAndDelete(filter);

  if (!transaction) {
    return res.status(404).json({ message: 'Transação não encontrada' });
  }

  return res.status(204).send();
}

module.exports = {
  createTransaction,
  listTransactions,
  listMyTransactions,
  updateTransaction,
  deleteTransaction,
};
