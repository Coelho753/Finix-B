const FiadorRequest = require('../models/FiadorRequest');
const { sanitizeInput } = require('../services/authService');

async function validateFiadorCode(req, res) {
  const code = sanitizeInput(req.params.code);
  const request = await FiadorRequest.findOne({ fiador_code: code, fiador_code_used: false, status: 'aprovado' });

  if (!request) {
    return res.json({ valid: false });
  }

  return res.json({
    valid: true,
    fiador_nome: request.fiador_nome,
    request_id: request._id,
  });
}

module.exports = {
  validateFiadorCode,
};
