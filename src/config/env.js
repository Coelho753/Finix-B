const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI
  || process.env.MONGODB_URI
  || process.env.DATABASE_URL
  || 'mongodb://127.0.0.1:27017/finix';

const mongoUriSource = process.env.MONGO_URI
  ? 'MONGO_URI'
  : process.env.MONGODB_URI
    ? 'MONGODB_URI'
    : process.env.DATABASE_URL
      ? 'DATABASE_URL'
      : 'fallback-local';

module.exports = {
  port: process.env.PORT || 3000,
  mongoUri,
  mongoUriSource,
  jwtSecret: process.env.JWT_SECRET || 'finix_secret_dev',
  adminSetupKey: process.env.ADMIN_SETUP_KEY || 'setup_admin_finix',
  resendApiKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || '',
  passwordResetUrlBase: process.env.PASSWORD_RESET_URL_BASE || '',
};
