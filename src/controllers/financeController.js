const {
  getFundData,
  saveFundData,
  buildFinanceSummary,
  getSocioFinancialSummary,
} = require('../services/financeService');

async function getFunds(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const funds = await getFundData();
  return res.json(funds);
}

async function updateFunds(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const funds = await saveFundData(req.body);
  return res.json(funds);
}

async function getFinanceDashboard(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const summary = await buildFinanceSummary();
  return res.json(summary);
}

async function getMyFinancialSummary(req, res) {
  const summary = await getSocioFinancialSummary(req.user._id);
  if (!summary) {
    return res.status(404).json({ message: 'Resumo financeiro disponível apenas para sócios' });
  }

  return res.json(summary);
}

module.exports = {
  getFunds,
  updateFunds,
  getFinanceDashboard,
  getMyFinancialSummary,
};
