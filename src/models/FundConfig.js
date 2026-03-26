const mongoose = require('mongoose');

const fundConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },

    // Legacy fields used by existing finance endpoints
    f1_value: { type: Number, default: 0 },
    f2_value: { type: Number, default: 0 },

    // New fields used by /api/fund-config
    f1_balance: { type: Number, default: 0 },
    f2_balance: { type: Number, default: 0 },
    f1_description: {
      type: String,
      default: 'Fundo de investimento dos sócios',
      trim: true,
    },
    f2_description: {
      type: String,
      default: 'Fundo exclusivo de diretores',
      trim: true,
    },
    taxa_lucro: { type: Number, default: 0 },
    aportes_override: { type: Map, of: Number, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FundConfig', fundConfigSchema);
