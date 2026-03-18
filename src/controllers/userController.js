const User = require('../models/User');

async function listUsers(req, res) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Sem permissão' });
  }

  const users = await User.find({}, 'name email role').sort({ name: 1 });
  return res.json(users);
}

async function listSocios(req, res) {
  const socios = await User.find({ role: 'socio' }, 'name email role').sort({ name: 1 });
  return res.json(socios);
}

module.exports = {
  listUsers,
  listSocios,
};
