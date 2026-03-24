const env = require('../config/env');

function isEmailConfigured() {
  return Boolean(env.resendApiKey && env.emailFrom && env.passwordResetUrlBase);
}

function buildResetUrl(token) {
  const base = env.passwordResetUrlBase;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}token=${encodeURIComponent(token)}`;
}

async function sendPasswordResetEmail({ to, name, token }) {
  if (!isEmailConfigured()) {
    const error = new Error('Serviço de e-mail não configurado no backend');
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
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
          <h2>Recuperação de senha</h2>
          <p>Olá, ${name || 'usuário'}.</p>
          <p>Recebemos uma solicitação para redefinir sua senha.</p>
          <p><a href="${resetUrl}">Clique aqui para redefinir sua senha</a></p>
          <p>Se preferir, use este token manualmente:</p>
          <pre style="padding:12px;background:#f3f4f6;border-radius:6px;">${token}</pre>
          <p>Este link/token expira em 15 minutos.</p>
        </div>
      `,
      text: `Olá, ${name || 'usuário'}! Use o link ${resetUrl} ou o token ${token} para redefinir sua senha. O token expira em 15 minutos.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Falha ao enviar email: ${response.status} ${body}`);
    error.code = 'EMAIL_SEND_FAILED';
    throw error;
  }

  return response.json();
}

module.exports = {
  isEmailConfigured,
  sendPasswordResetEmail,
};
