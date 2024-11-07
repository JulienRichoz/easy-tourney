// models/inviteToken.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class InviteToken extends Model {
    static associate(models) {
      // Associer un token d'invitation à un tournoi
      InviteToken.belongsTo(models.Tourney, {
        foreignKey: 'tourneyId',
        as: 'tourney',
        onDelete: 'CASCADE',
      });
    }
  }

  InviteToken.init({
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isValid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'InviteToken',
  });

  return InviteToken;
};
