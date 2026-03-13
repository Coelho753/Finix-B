const User = require('../models/User');
const PromotionCode = require('../models/PromotionCode');
const env = require('../config/env');
const { hashPassword, comparePassword, signToken } = require('../services/authService');

async function register(req, res) {
  const { name, email, password, guarantorName, adminKey } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    return res.status(409).json({ message: 'E-mail já cadastrado' });
  }

  const role = adminKey && adminKey === env.adminSetupKey ? 'admin' : 'terceiro';
  const user = await User.create({
    name,
    email,
    guarantorName,
    role,
    passwordHash: await hashPassword(password),
  });

  return res.status(201).json({
    id: user._id,
    role: user.role,
    token: signToken(user),
  });
}

async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const ok = await comparePassword(password || '', user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  return res.json({
    id: user._id,
    role: user.role,
    token: signToken(user),
  });
}

async function promoteToSocio(req, res) {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Código é obrigatório' });
  }

  if (req.user.role !== 'terceiro') {
    return res.status(400).json({ message: 'Somente terceiros podem virar sócios' });
  }

  const promotion = await PromotionCode.findOne({ code, active: true });
  if (!promotion) {
    return res.status(404).json({ message: 'Código inválido' });
  }

  if (promotion.expiresAt && promotion.expiresAt < new Date()) {
    return res.status(400).json({ message: 'Código expirado' });
  }

  req.user.role = 'socio';
  await req.user.save();

  promotion.active = false;
  promotion.usedBy = req.user._id;
  await promotion.save();

  return res.json({
    message: 'Conta promovida para sócio com sucesso',
    role: req.user.role,
    token: signToken(req.user),
  });
}

module.exports = { register, login, promoteToSocio };
