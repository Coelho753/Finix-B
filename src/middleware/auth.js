const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

// 🔐 Middleware de autenticação
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;

    // ❌ Sem token
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token ausente' });
    }

    // 🔑 Extrair token
    const token = header.split(' ')[1];

    // 🔍 Verificar token
    const payload = jwt.verify(token, env.jwtSecret);

    // 🔥 Garantir que tem ID válido
    if (!payload.id) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    // 🧠 Buscar usuário REAL no banco
    const user = await User.findById(payload.id).select('-passwordHash');

    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    // ✅ Injetar usuário real na request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Token inválido ou expirado',
    });
  }
}

// 🔒 Controle de acesso por role
function requireRole(...roles) {
  return (req, res, next) => {
    try {
      // ❌ Sem usuário autenticado
      if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
      }

      // ❌ Sem permissão
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          message: `Acesso negado. Requer: ${roles.join(', ')}`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        message: 'Erro ao validar permissões',
      });
    }
  };
}

module.exports = {
  requireAuth,
  requireRole,
};
