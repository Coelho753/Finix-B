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

function serializeUser(user) {
  return {
    id: String(user._id),
    _id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

function buildAuthResponse(user, message) {
  const token = signToken(user);
  const payload = {
    user: serializeUser(user),
    token,
    accessToken: token,
  };

  if (message) payload.message = message;
  return payload;
}

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

  const role = typeof cleanRole === 'string' ? cleanRole.trim().toLowerCase() : '';
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

  const dbUser = await User.findById(user._id);
  return res.status(201).json(buildAuthResponse(dbUser));
}

async function login(req, res) {
  const email = sanitizeInput(req.body?.email || '').toLowerCase();
  const password = sanitizeInput(req.body?.password || '');

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }
}

// 🔐 LOGIN (CORRIGIDO E SEGURO)
async function login(req, res) {
  try {
    const email = sanitizeInput(req.body?.email || '').toLowerCase();
    const password = sanitizeInput(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    return res.json(buildAuthResponse(user));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

  const dbUser = await User.findById(user._id);
  if (!dbUser) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json(buildAuthResponse(dbUser));
}

async function getMe(req, res) {
  const dbUser = await User.findById(req.user._id);
  if (!dbUser) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json(buildAuthResponse(dbUser));
}

// 🚪 LOGOUT
async function logout(req, res) {
  return res.status(200).json({ message: 'Logout realizado com sucesso' });
}

// 🔁 FORGOT PASSWORD
async function forgotPassword(req, res) {
  try {
    const email = sanitizeInput(req.body?.email || '').toLowerCase();

    if (!email) {
      return res.status(400).json({ message: 'E-mail é obrigatório' });
    }

    const user = await User.findOne({ email });

    const genericMessage =
      'Se o email estiver cadastrado, você receberá instruções para redefinir a senha';

    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(24).toString('hex');

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      token: resetToken,
    });

    return res.status(200).json({ message: genericMessage });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// 🔁 RESET PASSWORD
async function resetPassword(req, res) {
  try {
    const token = sanitizeInput(req.body?.token || '');
    const password = sanitizeInput(req.body?.password || '');

    if (!token || !password) {
      return res.status(400).json({ message: 'Token e senha obrigatórios' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Senha fraca' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    user.passwordHash = await hashPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    return res.json({ message: 'Senha atualizada com sucesso' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// 🚀 PROMOVER TERCEIRO → SOCIO
async function promoteToSocio(req, res) {
  try {
    const code = sanitizeInput(req.body?.code);

    if (!code) {
      return res.status(400).json({ message: 'Código obrigatório' });
    }

    if (req.user.role !== 'terceiro') {
      return res.status(403).json({ message: 'Apenas terceiros podem virar sócio' });
    }

    const promotion = await PromotionCode.findOne({ code, active: true });

    if (!promotion) {
      return res.status(404).json({ message: 'Código inválido' });
    }

    if (promotion.expiresAt && promotion.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Código expirado' });
    }

  const dbUser = await User.findById(req.user._id);
  return res.json(buildAuthResponse(dbUser, 'Conta promovida para sócio com sucesso'));
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