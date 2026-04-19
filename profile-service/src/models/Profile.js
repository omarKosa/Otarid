const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profile = sequelize.define(
  'Profile',
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [1, 50], msg: 'Name cannot exceed 50 characters' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please provide a valid email' },
      },
    },
    bio: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    tableName: 'profiles',
    timestamps: true,
  }
);

module.exports = Profile;
