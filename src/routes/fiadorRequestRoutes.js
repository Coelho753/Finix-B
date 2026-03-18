const express = require('express');
const {
  createFiadorRequest,
  listMyFiadorRequests,
  listFiadorRequestsForMe,
  updateFiadorRequest,
  deleteFiadorRequest,
} = require('../controllers/fiadorRequestController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createFiadorRequest);
router.get('/mine', requireAuth, listMyFiadorRequests);
router.get('/for-me', requireAuth, listFiadorRequestsForMe);
router.put('/:id', requireAuth, updateFiadorRequest);
router.delete('/:id', requireAuth, deleteFiadorRequest);

module.exports = router;
