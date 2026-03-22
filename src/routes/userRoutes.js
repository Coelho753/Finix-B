const express = require('express');
const {
  listUsers,
  listSocios,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/socios', requireAuth, listSocios);
router.get('/', requireAuth, listUsers);
router.post('/', requireAuth, createUser);
router.put('/:id', requireAuth, updateUser);
router.delete('/:id', requireAuth, deleteUser);

module.exports = router;
