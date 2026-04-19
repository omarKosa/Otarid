const express = require('express');
const router = express.Router();

const internalAuth = require('../middleware/internalAuth');
const { patchUser } = require('../controllers/internalController');

router.use(internalAuth);
router.patch('/users/:userId', patchUser);

module.exports = router;
