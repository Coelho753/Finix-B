const express = require('express');
const { listSiteContent, updateSiteContent } = require('../controllers/siteContentController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', listSiteContent);
router.put('/:id', requireAuth, updateSiteContent);

module.exports = router;
