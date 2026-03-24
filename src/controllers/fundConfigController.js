const { getFundData, saveFundData } = require('../services/financeService');

async function getFundConfig(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const fundConfig = await getFundData();
  return res.json(fundConfig);
}

async function updateFundConfig(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const fundConfig = await saveFundData(req.body);
  return res.json(fundConfig);
}

module.exports = {
  getFundConfig,
  updateFundConfig,
};
