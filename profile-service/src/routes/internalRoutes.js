const express = require('express');
const router = express.Router();

const internalAuth = require('../middleware/internalAuth');
const { bootstrapProfile, deleteProfileInternal } = require('../controllers/internalController');

router.use(internalAuth);
router.post('/profile/bootstrap', bootstrapProfile);
router.delete('/profile/:userId', deleteProfileInternal);

module.exports = router;
