const PageContent = require('../models/PageContent');
const PromotionCode = require('../models/PromotionCode');

async function updateLoanPage(req, res) {
  const payload = req.body;
  const updated = await PageContent.findOneAndUpdate(
    { slug: 'emprestimos' },
    payload,
    { new: true, upsert: true }
  );
  return res.json(updated);
}

async function createPromotionCode(req, res) {
  const { code, expiresAt } = req.body;
  if (!code) {
    return res.status(400).json({ message: 'Informe um código' });
  }

  const created = await PromotionCode.create({ code, expiresAt });
  return res.status(201).json(created);
}

module.exports = { updateLoanPage, createPromotionCode };
