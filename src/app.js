const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');
const siteContentRoutes = require('./routes/siteContentRoutes');
const loanRoutes = require('./routes/loanRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentNotificationRoutes = require('./routes/paymentNotificationRoutes');
const userRoutes = require('./routes/userRoutes');
const fiadorRequestRoutes = require('./routes/fiadorRequestRoutes');
const membershipCodeRoutes = require('./routes/membershipCodeRoutes');
const fiadorCodeRoutes = require('./routes/fiadorCodeRoutes');
const financeRoutes = require('./routes/financeRoutes');
const fundConfigRoutes = require('./routes/fundConfigRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/content', contentRoutes);
app.use('/loans', loanRoutes);
app.use('/transactions', transactionRoutes);
app.use('/payment-notifications', paymentNotificationRoutes);
app.use('/users', userRoutes);
app.use('/fiador-requests', fiadorRequestRoutes);
app.use('/site-content', siteContentRoutes);
app.use('/membership-codes', membershipCodeRoutes);
app.use('/fiador-codes', fiadorCodeRoutes);
app.use('/finance', financeRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payment-notifications', paymentNotificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fiador-requests', fiadorRequestRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/membership-codes', membershipCodeRoutes);
app.use('/api/fiador-codes', fiadorCodeRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/fund-config', fundConfigRoutes);

module.exports = app;
