const express = require('express');
const {
  listUsers,
  listSocios,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');

const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// 🔥 ADMIN ONLY
router.get('/socios', requireAuth, requireRole('admin'), listSocios);
router.get('/', requireAuth, requireRole('admin'), listUsers);
router.post('/', requireAuth, requireRole('admin'), createUser);
router.put('/:id', requireAuth, requireRole('admin'), updateUser);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

// 🔥 NOVA ROTA PRA ALTERAR ROLE
router.patch('/:id/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'socio', 'terceiro'].includes(role)) {
      return res.status(400).json({ message: 'Role inválida' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;