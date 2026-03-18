const PromotionCode = require('../models/PromotionCode');
const { sanitizeInput, signToken } = require('../services/authService');

function generateRandomCode(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function serializeMembershipCode(doc) {
  return {
    _id: doc._id,
    code: doc.code,
    is_used: !doc.active,
    created_at: doc.createdAt,
    used_at: doc.usedAt,
    used_by_name: doc.usedByName,
  };
}

async function listMembershipCodes(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const codes = await PromotionCode.find({}).sort({ createdAt: -1 });
  return res.json(codes.map(serializeMembershipCode));
}

async function createMembershipCode(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  let code;
  do {
    code = generateRandomCode();
  } while (await PromotionCode.exists({ code }));

  const created = await PromotionCode.create({ code });
  return res.status(201).json(serializeMembershipCode(created));
}

async function validateMembershipCode(req, res) {
  const code = sanitizeInput(req.params.code);
  const promotion = await PromotionCode.findOne({ code, active: true });
  return res.json({ valid: Boolean(promotion) });
}

async function useMembershipCode(req, res) {
  const code = sanitizeInput(req.body?.code);
  if (!code) {
    return res.status(400).json({ message: 'Código é obrigatório' });
  }

  if (req.user.role !== 'terceiro') {
    return res.status(400).json({ message: 'Somente terceiros podem usar código de sócio' });
  }

  const promotion = await PromotionCode.findOne({ code, active: true });
  if (!promotion) {
    return res.status(404).json({ message: 'Código inválido' });
  }

  req.user.role = 'socio';
  await req.user.save();

  promotion.active = false;
  promotion.usedBy = req.user._id;
  promotion.usedByName = req.user.name;
  promotion.usedAt = new Date();
  await promotion.save();

  return res.json({
    success: true,
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
  listMembershipCodes,
  createMembershipCode,
  validateMembershipCode,
  useMembershipCode,
};
