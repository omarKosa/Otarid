const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sequelize } = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [1, 20], msg: 'Name cannot exceed 20 characters' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please provide a valid email' },
        notEmpty: { msg: 'Email is required' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    bio: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    // Array of { token, createdAt } stored as JSONB
    refreshTokens: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    // Exclude sensitive fields from all queries by default
    defaultScope: {
      attributes: {
        exclude: ['password', 'refreshTokens', 'passwordResetToken', 'passwordResetExpires'],
      },
    },
    scopes: {
      // Use User.scope('withSecrets') when you need password / tokens
      withSecrets: { attributes: {} },
    },
  }
);

// ─── Hooks ────────────────────────────────────────────────────────────────────

// Hash password before saving
User.addHook('beforeSave', async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
    if (!user.isNewRecord) {
      user.passwordChangedAt = new Date(Date.now() - 1000);
    }
  }
});

// Prune refresh tokens older than 7 days
User.addHook('beforeSave', (user) => {
  if (user.changed('refreshTokens') && Array.isArray(user.refreshTokens)) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    user.refreshTokens = user.refreshTokens.filter(
      (t) => new Date(t.createdAt) > sevenDaysAgo
    );
  }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────

User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

User.prototype.changedPasswordAfter = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimestamp < changedAt;
  }
  return false;
};

// Safe user object to send in responses (no secrets)
User.prototype.toSafeJSON = function () {
  const obj = this.toJSON();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

module.exports = User;
