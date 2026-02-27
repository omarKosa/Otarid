const express = require('express');
const router = express.Router();

const { getProfile, updateProfile, uploadAvatar, deleteAvatar, changePassword, deleteAccount } = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const { validate, updateProfileRules } = require('../middleware/validators');
const upload = require('../utils/upload');

// All profile routes require authentication
router.use(protect);

router.get('/', getProfile);
router.patch('/', updateProfileRules, validate, updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/avatar', deleteAvatar);
router.patch('/change-password', changePassword);
router.delete('/delete-account', deleteAccount);

module.exports = router;
