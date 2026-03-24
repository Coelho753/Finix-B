const express = require('express');
const {
  createTransaction,
  listTransactions,
  listMyTransactions,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createTransaction);
router.get('/', requireAuth, listTransactions);
router.get('/mine', requireAuth, listMyTransactions);
router.put('/:id', requireAuth, updateTransaction);
router.delete('/:id', requireAuth, deleteTransaction);

module.exports = router;
