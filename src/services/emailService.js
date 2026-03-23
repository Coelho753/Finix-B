const env = require('../config/env');

function isEmailConfigured() {
  return Boolean(env.resendApiKey && env.emailFrom && env.passwordResetUrlBase);
}

function buildResetUrl(token) {
  return `${env.passwordResetUrlBase}?token=${token}`;
}

async function sendPasswordResetEmail({ to, name, token }) {
  if (!isEmailConfigured()) {
    const error = new Error('Serviço de e-mail não configurado');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const resetUrl = buildResetUrl(token);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.emailFrom,
      to: [to],
      subject: 'Recuperação de senha - Grupo Finix',
      html: `
        <h2>Recuperação de senha</h2>
        <p>Olá ${name}</p>
        <a href="${resetUrl}">Redefinir senha</a>
        <p>Token: ${token}</p>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error('Erro ao enviar email');
  }

  return response.json();
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};