const express = require('express');
const { validateFiadorCode, consumeFiadorCode } = require('../controllers/fiadorCodeController');

const router = express.Router();

router.get('/validate/:code', validateFiadorCode);
router.post('/consume', consumeFiadorCode);

module.exports = router;
