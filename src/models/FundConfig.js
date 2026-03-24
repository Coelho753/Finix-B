const mongoose = require('mongoose');

const fundConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    f1_balance: { type: Number, default: 0 },
    f2_balance: { type: Number, default: 0 },
    f1_description: { type: String, default: '', trim: true },
    f2_description: { type: String, default: '', trim: true },
    taxa_lucro: { type: Number, default: 0 },
    aportes_override: { type: Map, of: Number, default: {} },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FundConfig', fundConfigSchema);
