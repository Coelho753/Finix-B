const mongoose = require('mongoose');

const fundConfigSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'default', unique: true },
    f1_value: { type: Number, default: 0 },
    f1_description: { type: String, default: '', trim: true },
    f2_value: { type: Number, default: 0 },
    f2_description: { type: String, default: '', trim: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FundConfig', fundConfigSchema);
