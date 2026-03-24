const User = require('../models/User');
const { hashPassword, isStrongPassword, sanitizeInput } = require('../services/authService');

function assertAdmin(req, res) {
  if (req.user.role !== 'admin') {
    res.status(403).json({ message: 'Sem permissão' });
    return false;
  }
  return true;
}

async function listUsers(req, res) {
  if (!assertAdmin(req, res)) return undefined;

  const users = await User.find({}, 'name email role titulo').sort({ name: 1 });
  return res.json(users);
}

async function listSocios(req, res) {
  const socios = await User.find({ role: 'socio' }, 'name email role titulo').sort({ name: 1 });
  return res.json(socios);
}

async function createUser(req, res) {
  if (!assertAdmin(req, res)) return undefined;

  const name = sanitizeInput(req.body?.name);
  const email = sanitizeInput(req.body?.email || '').toLowerCase();
  const password = sanitizeInput(req.body?.password || '');
  const role = sanitizeInput(req.body?.role);
  const titulo = sanitizeInput(req.body?.titulo);

  if (!name || !email || !password || !['terceiro', 'socio', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Dados do usuário inválidos' });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: 'Senha fora da política exigida' });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'E-mail já cadastrado' });
  }

  const user = await User.create({
    name,
    email,
    role,
    titulo,
    passwordHash: await hashPassword(password),
  });

  return res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, titulo: user.titulo });
}

async function updateUser(req, res) {
  if (!assertAdmin(req, res)) return undefined;

  const updates = {};
  if (req.body?.name !== undefined) updates.name = sanitizeInput(req.body.name);
  if (req.body?.email !== undefined) updates.email = sanitizeInput(req.body.email).toLowerCase();
  if (req.body?.role !== undefined) updates.role = sanitizeInput(req.body.role);
  if (req.body?.titulo !== undefined) updates.titulo = sanitizeInput(req.body.titulo);

  if (updates.role && !['terceiro', 'socio', 'admin'].includes(updates.role)) {
    return res.status(400).json({ message: 'Role inválida' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
    fields: 'name email role titulo',
  });

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json(user);
}

async function deleteUser(req, res) {
  if (!assertAdmin(req, res)) return undefined;

  if (String(req.user._id) === req.params.id) {
    return res.status(400).json({ message: 'Você não pode excluir seu próprio usuário' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.status(204).send();
}

module.exports = {
  listUsers,
  listSocios,
  createUser,
  updateUser,
  deleteUser,
};
