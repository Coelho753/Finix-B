const FiadorRequest = require('../models/FiadorRequest');
const { sanitizeInput } = require('../services/authService');

async function validateFiadorCode(req, res) {
  const code = sanitizeInput(req.params.code);
  const request = await FiadorRequest.findOne({
    fiador_code: code,
    fiador_code_used: false,
    status: 'aprovado',
  });

  if (!request) {
    return res.json({ valid: false });
  }

  return res.json({
    valid: true,
    fiador_nome: request.fiador_nome,
    request_id: request._id,
  });
}

async function consumeFiadorCode(req, res) {
  const code = sanitizeInput(req.body?.code);
  if (!code) {
    return res.status(400).json({ success: false, message: 'Código é obrigatório' });
  }

  const request = await FiadorRequest.findOne({
    fiador_code: code,
    fiador_code_used: false,
    status: 'aprovado',
  });

  if (!request) {
    return res.status(404).json({ success: false, message: 'Código inválido ou já utilizado' });
  }

  request.fiador_code_used = true;
  await request.save();

  return res.json({ success: true });
}

module.exports = {
  validateFiadorCode,
  consumeFiadorCode,
};
