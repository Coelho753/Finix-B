const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['terceiro', 'socio', 'admin'],
      default: 'terceiro',
    },
    titulo: { type: String, default: '' },
    cpf: { type: String, default: '' },
    cep: { type: String, default: '' },
    endereco: { type: String, default: '' },
    telefone: { type: String, default: '' },
    guarantorName: { type: String },
    resetToken: { type: String },
    resetTokenExpire: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
