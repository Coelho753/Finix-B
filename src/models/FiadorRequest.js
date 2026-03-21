const mongoose = require('mongoose');

const fiadorRequestSchema = new mongoose.Schema(
  {
    solicitante_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    solicitante_nome: { type: String, required: true, trim: true },
    fiador_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fiador_nome: { type: String, required: true, trim: true },
    valor_emprestimo: { type: Number, required: true },
    quantidade_parcelas: { type: Number, required: true },
    mensagem: { type: String, trim: true },
    fiador_code: { type: String, trim: true, unique: true, sparse: true },
    fiador_code_used: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pendente', 'aprovado', 'rejeitado'],
      default: 'pendente',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('FiadorRequest', fiadorRequestSchema);
