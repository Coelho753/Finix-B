const dotenv = require('dotenv');

dotenv.config();

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finix',
  jwtSecret: process.env.JWT_SECRET || 'finix_secret_dev',
  adminSetupKey: process.env.ADMIN_SETUP_KEY || 'setup_admin_finix',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  passwordResetUrlBase: process.env.PASSWORD_RESET_URL_BASE || '',
};
