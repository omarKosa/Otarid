const { Op } = require('sequelize');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * PATCH /internal/users/:userId — sync name/email from profile-service.
 */
exports.patchUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name, email } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  if (email !== undefined && email !== user.email) {
    const exists = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: userId },
      },
    });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email already in use.' });
    }
    user.email = email;
  }

  if (name !== undefined) {
    user.name = name;
  }

  await user.save();

  logger.debug('User synced from profile service.', { userId });

  res.status(200).json({ success: true });
});
