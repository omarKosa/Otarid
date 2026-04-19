const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, uploadAvatar, deleteAvatar } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { validate, updateProfileRules } = require('../middleware/validators');
const upload = require('../utils/upload');

router.use(protect);

router.get('/', getProfile);
router.patch('/', updateProfileRules, validate, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);

module.exports = router;
