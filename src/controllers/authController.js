const crypto = require('crypto');
const User = require('../models/User');
const PromotionCode = require('../models/PromotionCode');
const {
  hashPassword,
  comparePassword,
  signToken,
  isStrongPassword,
  sanitizeInput,
} = require('../services/authService');
const { sendPasswordResetEmail } = require('../services/emailService');


async function register(req, res) {
  const cleanName = sanitizeInput(req.body?.name);
  const cleanEmail = sanitizeInput(req.body?.email);
  const cleanPassword = sanitizeInput(req.body?.password);
  const cleanRole = sanitizeInput(req.body?.role);

  if (!cleanName || !cleanEmail || !cleanPassword) {
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
  }

  if (!isStrongPassword(cleanPassword)) {
    return res.status(400).json({
      message:
        'A senha deve ter ao menos 8 caracteres, com maiúscula, minúscula, número e caractere especial',
    });
  }

  const role = typeof cleanRole === 'string' ? cleanRole.toLowerCase() : '';
  if (!['admin', 'socio', 'terceiro'].includes(role)) {
    return res.status(400).json({ message: 'Role inválida. Use admin, socio ou terceiro' });
  }

  const email = cleanEmail.toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: 'E-mail já cadastrado' });
  }

  const user = await User.create({
    name: cleanName,
    email,
    role,
    passwordHash: await hashPassword(cleanPassword),
  });

  return res.status(201).json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token: signToken(user),
  });
}

async function login(req, res) {
  const email = sanitizeInput(req.body?.email || '').toLowerCase();
  const password = sanitizeInput(req.body?.password || '');
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  return res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    token: signToken(user),
  });
}


async function getMe(req, res) {
  return res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
    token: signToken(req.user),
  });
}

async function logout(req, res) {
  return res.status(200).json({ message: 'Logout realizado com sucesso', success: true });
}

async function forgotPassword(req, res) {
  const email = sanitizeInput(req.body?.email || '').toLowerCase();
  if (!email) {
    return res.status(400).json({ success: false, message: 'E-mail é obrigatório' });
  }

  const genericMessage = 'Se o email estiver cadastrado, você receberá instruções para redefinir a senha';
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(200).json({ success: true, message: genericMessage });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
  await user.save();

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });
  } catch (error) {
    if (error.code === 'EMAIL_NOT_CONFIGURED') {
      return res.status(503).json({
        success: false,
        message: 'Serviço de e-mail não configurado no backend. Configure RESEND_API_KEY, EMAIL_FROM e PASSWORD_RESET_URL_BASE no Render.',
      });
    }

    return res.status(502).json({
      success: false,
      message: 'Não foi possível enviar o e-mail de recuperação no momento.',
    });
  }

  return res.status(200).json({
    success: true,
    message: genericMessage,
    expiresAt: user.resetPasswordExpiresAt,
  });
}

async function resetPassword(req, res) {
  const token = sanitizeInput(req.body?.token || '');
  const nextPassword = sanitizeInput(req.body?.password || req.body?.newPassword || '');

  if (!token || !nextPassword) {
    return res.status(400).json({ success: false, message: 'Token e nova senha são obrigatórios' });
  }

  if (!isStrongPassword(nextPassword)) {
    return res.status(400).json({
      success: false,
      message:
        'A senha deve ter ao menos 8 caracteres, com maiúscula, minúscula, número e caractere especial',
    });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Token inválido ou expirado' });
  }

  user.passwordHash = await hashPassword(nextPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: 'Senha atualizada com sucesso' });
}

async function promoteToSocio(req, res) {
  const code = sanitizeInput(req.body?.code);
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
  promotion.usedByName = req.user.name;
  promotion.usedAt = new Date();
  await promotion.save();

  return res.json({
    message: 'Conta promovida para sócio com sucesso',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    },
    token: signToken(req.user),
  });
}

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  promoteToSocio,
};
