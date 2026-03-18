const express = require('express');
const { validateFiadorCode } = require('../controllers/fiadorCodeController');

const router = express.Router();

router.get('/validate/:code', validateFiadorCode);

module.exports = router;
