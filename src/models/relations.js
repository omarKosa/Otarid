const User = require('../../Otarid/src/models/User');
const GoogleUser = require('./GoogleUser');

// One-to-One: User has one GoogleUser
User.hasOne(GoogleUser, {
  foreignKey: 'userId',
  as: 'googleUser',
});

// One-to-One: GoogleUser belongs to User
GoogleUser.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

module.exports = { User, GoogleUser };