const FiadorRequest = require('../models/FiadorRequest');
const User = require('../models/User');
const { sanitizeInput } = require('../services/authService');

function generateRandomCode(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function uniqueFiadorCode() {
  let code;
  do {
    code = generateRandomCode();
  } while (await FiadorRequest.exists({ fiador_code: code }));
  return code;
}

async function createFiadorRequest(req, res) {
  if (req.user.role === 'admin') {
    return res.status(400).json({ message: 'Admin não pode criar solicitação de fiador' });
  }

  const fiadorId = sanitizeInput(req.body?.fiador_id);
  const valorEmprestimo = Number(req.body?.valor_emprestimo);
  const quantidadeParcelas = Number(req.body?.quantidade_parcelas);
  const mensagem = sanitizeInput(req.body?.mensagem);

  if (
    !fiadorId ||
    !Number.isFinite(valorEmprestimo) ||
    valorEmprestimo <= 0 ||
    !Number.isFinite(quantidadeParcelas) ||
    quantidadeParcelas <= 0
  ) {
    return res.status(400).json({ message: 'Dados da solicitação de fiador inválidos' });
  }

  if (String(req.user._id) === fiadorId) {
    return res.status(400).json({ message: 'Você não pode selecionar a si mesmo como fiador' });
  }

  const fiador = await User.findOne({ _id: fiadorId, role: 'socio' });
  if (!fiador) {
    return res.status(404).json({ message: 'Fiador não encontrado' });
  }

  const request = await FiadorRequest.create({
    solicitante_id: req.user._id,
    solicitante_nome: req.user.name,
    fiador_id: fiador._id,
    fiador_nome: fiador.name,
    valor_emprestimo: valorEmprestimo,
    quantidade_parcelas: quantidadeParcelas,
    mensagem,
  });

  return res.status(201).json(request);
}

async function listMyFiadorRequests(req, res) {
  const requests = await FiadorRequest.find({ solicitante_id: req.user._id }).sort({ created_at: -1 });
  return res.json(requests);
}

async function listFiadorRequestsForMe(req, res) {
  const requests = await FiadorRequest.find({ fiador_id: req.user._id }).sort({ created_at: -1 });
  return res.json(requests);
}

async function updateFiadorRequest(req, res) {
  const status = sanitizeInput(req.body?.status);
  if (!['aprovado', 'rejeitado'].includes(status)) {
    return res.status(400).json({ message: 'Status inválido' });
  }

  const request = await FiadorRequest.findOne({ _id: req.params.id, fiador_id: req.user._id });
  if (!request) {
    return res.status(404).json({ message: 'Solicitação de fiador não encontrada' });
  }

  if (request.status !== 'pendente') {
    return res.status(400).json({ message: 'Solicitação já foi processada' });
  }

  request.status = status;
  if (status === 'aprovado') {
    request.fiador_code = await uniqueFiadorCode();
    request.fiador_code_used = false;
  }
  await request.save();

  return res.json(request);
}

module.exports = {
  createFiadorRequest,
  listMyFiadorRequests,
  listFiadorRequestsForMe,
  updateFiadorRequest,
};
