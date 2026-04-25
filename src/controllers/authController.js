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
const env = require('../config/env');

function serializeUser(user) {
  return {
    id: String(user._id),
    _id: String(user._id),
    email: user.email,
    name: user.name,
    role: user.role,
    titulo: user.titulo || '',
    telefone: user.telefone || '',
    cpf: user.cpf || '',
    cep: user.cep || '',
    endereco: user.endereco || '',
    createdAt: user.createdAt,
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

// ================= REGISTER =================
async function register(req, res) {
  try {
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

    const normalizedRole = typeof cleanRole === 'string' ? cleanRole.trim().toLowerCase() : '';
    if (!['admin', 'socio', 'terceiro'].includes(normalizedRole)) {
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
      role: normalizedRole,
      passwordHash: await hashPassword(cleanPassword),
    });

    const dbUser = await User.findById(user._id);
    return res.status(201).json(buildAuthResponse(dbUser));
  } catch (err) {
    console.error('Erro em register:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

// ================= LOGIN =================
async function login(req, res) {
  try {
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

    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json(buildAuthResponse(dbUser));
  } catch (err) {
    console.error('Erro em login:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

async function getMe(req, res) {
  try {
    const dbUser = await User.findById(req.user._id);
    if (!dbUser) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    return res.json(buildAuthResponse(dbUser));
  } catch (err) {
    console.error('Erro em getMe:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

  const dbUser = await User.findById(user._id);
  if (!dbUser) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }

  return res.json(buildAuthResponse(dbUser));
}

async function forgotPassword(req, res) {
  try {
    const email = sanitizeInput(req.body?.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'E-mail é obrigatório' });
    }

    const user = await User.findOne({ email });

    // Resposta genérica por segurança
    if (!user) {
      return res.json({ message: 'Se existir, enviamos um email' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpire = new Date(Date.now() + 1000 * 60 * 15);

    // Compatibilidade com campos antigos
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = user.resetTokenExpire;

    await user.save();

    const baseUrl = env.passwordResetUrlBase || 'https://seusite.com/reset-password';
    const separator = baseUrl.includes('?') ? '&' : '?';
    const link = `${baseUrl}${separator}token=${rawToken}`;

    // Fluxo mínimo funcional (trocar por envio real de e-mail depois)
    console.log('LINK RESET:', link);

    return res.json({ message: 'Email enviado' });
  } catch (err) {
    console.error('Erro em forgotPassword:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}


async function resetPassword(req, res) {
  try {
    const token = sanitizeInput(req.body?.token || '');
    const nextPassword = sanitizeInput(req.body?.password || req.body?.newPassword || '');

    if (!token || !nextPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpire: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    user.passwordHash = await hashPassword(nextPassword);
    user.resetToken = null;
    user.resetTokenExpire = null;

    // Compatibilidade com campos antigos
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;

    await user.save();

    return res.json({ message: 'Senha redefinida com sucesso' });
  } catch (err) {
    console.error('Erro em resetPassword:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}


async function promoteToSocio(req, res) {
  try {
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

    const dbUser = await User.findById(req.user._id);
    return res.json(buildAuthResponse(dbUser, 'Conta promovida para sócio com sucesso'));
  } catch (err) {
    console.error('Erro em promoteToSocio:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

// ================= EXPORT =================
module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  promoteToSocio,
};