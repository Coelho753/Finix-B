const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

// 🔒 Política de senha forte
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// 🔐 HASH DE SENHA
async function hashPassword(password) {
  if (!password) {
    throw new Error('Senha não fornecida');
  }

  return bcrypt.hash(password, 10);
}

// 🔍 COMPARAR SENHA
async function comparePassword(password, hash) {
  if (!password || !hash) {
    return false;
  }

  return bcrypt.compare(password, hash);
}

// 🎟️ GERAR TOKEN JWT (PADRÃO CORRETO)
function signToken(user) {
  if (!user || !user._id) {
    throw new Error('Usuário inválido para gerar token');
  }

  return jwt.sign(
    {
      id: user._id.toString(), // 🔥 PADRÃO USADO EM TODO BACKEND
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: '7d',
    }
  );
}

// 🔐 VALIDAR FORÇA DA SENHA
function isStrongPassword(password) {
  return PASSWORD_POLICY_REGEX.test(password || '');
}

// 🧼 SANITIZAÇÃO DE INPUT
function sanitizeInput(value) {
  if (typeof value !== 'string') return value;

  return value
    .replace(/[<>"';(){}]/g, '') // remove caracteres perigosos
    .trim();
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  isStrongPassword,
  sanitizeInput,
};
