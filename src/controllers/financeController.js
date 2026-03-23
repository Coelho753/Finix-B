const FundConfig = require('../models/FundConfig');
const {
  buildFinanceSummary,
  getSocioFinancialSummary,
  getGeneralHistory,
} = require('../services/financeService');

// 🔥 GET CONFIG
async function getFunds(req, res) {
  let config = await FundConfig.findOne({ key: 'default' });

  if (!config) {
    config = await FundConfig.create({ key: 'default' });
  }

  return res.json(config);
}

// 🔥 UPDATE REAL (ANTES ESTAVA DEPENDENDO DO SERVICE)
async function updateFunds(req, res) {
  let config = await FundConfig.findOne({ key: 'default' });

  if (!config) {
    config = new FundConfig({ key: 'default' });
  }

  config.f1_value = req.body.f1_value ?? config.f1_value;
  config.f1_description = req.body.f1_description ?? config.f1_description;
  config.f2_value = req.body.f2_value ?? config.f2_value;
  config.f2_description = req.body.f2_description ?? config.f2_description;

  await config.save();

  return res.json(config);
}

// DASHBOARD
async function getFinanceDashboard(req, res) {
  const summary = await buildFinanceSummary();
  return res.json(summary);
}

// HISTORY
async function getFinanceHistory(req, res) {
  const history = await getGeneralHistory();
  return res.json(history);
}

// USER SUMMARY
async function getMyFinancialSummary(req, res) {
  const summary = await getSocioFinancialSummary(req.user._id);

  if (!summary) {
    return res.status(404).json({
      message: 'Resumo financeiro disponível apenas para sócios',
    });
  }

  return res.json(summary);
}

module.exports = {
  getFunds,
  updateFunds,
  getFinanceDashboard,
  getFinanceHistory,
  getMyFinancialSummary,
};