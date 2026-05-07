const express = require('express');
const FundConfig = require('../models/FundConfig');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

async function getOrCreateConfig() {
  let config = await FundConfig.findOne({ key: 'default' });

  if (!config) {
    config = await FundConfig.create({
      key: 'default',
      f1_balance: 0,
      f2_balance: 0,
      f1_description: 'Fundo de investimento dos sócios',
      f2_description: 'Fundo exclusivo de diretores',
      taxa_lucro: 0,
      aportes_override: {},
    });
  }

  return config;
}

// GET /api/fund-config
router.get('/', async (_req, res) => {
  try {
    const config = await getOrCreateConfig();
    return res.json(config);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// PUT /api/fund-config (admin only)
router.put('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    let config = await FundConfig.findOne({ key: 'default' });

    if (!config) {
      config = await FundConfig.create({ key: 'default', ...req.body });
    } else {
      Object.assign(config, req.body);
      await config.save();
    }

    return res.json(config);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
