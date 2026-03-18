const mongoose = require('mongoose');

const parcelaSchema = new mongoose.Schema(
  {
    numero: { type: Number, required: true },
    valor: { type: Number, required: true },
    paga: { type: Boolean, default: false },
    data_pagamento: { type: Date },
  },
  { _id: false }
);

const transactionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    valor_emprestimo: { type: Number, required: true },
    taxa: { type: Number, required: true },
    valor_total: { type: Number, required: true },
    quantidade_parcelas: { type: Number, required: true },
    parcelas: { type: [parcelaSchema], default: [] },
    tipo: { type: String, enum: ['socio', 'terceiro'], required: true },
    fiador_nome: { type: String, trim: true },
    fiador_telefone: { type: String, trim: true },
    fiador_code: { type: String, trim: true },
    data_emprestimo: { type: Date, required: true },
    observacoes: { type: String, trim: true },
    status: {
      type: String,
      enum: ['ativo', 'quitado', 'inadimplente'],
      default: 'ativo',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Transaction', transactionSchema);
