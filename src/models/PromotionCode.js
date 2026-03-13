const mongoose = require('mongoose');

const promotionCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromotionCode', promotionCodeSchema);
