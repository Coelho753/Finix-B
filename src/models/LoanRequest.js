const mongoose = require('mongoose');

const loanRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userRoleAtRequest: { type: String, enum: ['terceiro', 'socio', 'admin'], required: true },
    type: {
      type: String,
      enum: ['socio_12x', 'socio_30d', 'terceiro_12x', 'terceiro_30d'],
      required: true,
    },
    principal: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true },
    totalToPay: { type: Number, required: true },
    installments: { type: Number, required: true },
    status: { type: String, enum: ['solicitado', 'analisando', 'aprovado', 'reprovado'], default: 'solicitado' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoanRequest', loanRequestSchema);
