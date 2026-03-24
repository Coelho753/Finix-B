const mongoose = require('mongoose');

const promotionCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    usedByName: { type: String, trim: true },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PromotionCode', promotionCodeSchema);
