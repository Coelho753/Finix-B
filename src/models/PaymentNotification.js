const mongoose = require('mongoose');

const paymentNotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    user_name: { type: String, required: true, trim: true },
    mes_referencia: { type: String, required: true, trim: true },
    valor: { type: Number, required: true },
    mensagem: { type: String, trim: true },
    comprovante_url: { type: String, trim: true },
    status: {
      type: String,
      enum: ['pendente', 'confirmado', 'rejeitado'],
      default: 'pendente',
    },
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    parcela_numero: { type: Number },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('PaymentNotification', paymentNotificationSchema);
