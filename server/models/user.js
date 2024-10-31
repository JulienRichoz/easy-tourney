// models/user.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Association avec le rôle global
      User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });

      // Association avec les tournois via UsersTourneys (relation N-N)
      User.belongsToMany(models.Tourney, {
        through: models.UsersTourneys, // Table intermédiaire
        foreignKey: 'userId',
        otherKey: 'tourneyId',
        as: 'tourneys'
      });

      // Association inverse pour accéder aux UsersTourneys
      User.hasMany(models.UsersTourneys, { foreignKey: 'userId', as: 'usersTourneys' });
    }
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    roleId: {
      type: DataTypes.INTEGER,
      defaultValue: 2, // Role USER par défaut si aucun role spécifié
    },
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
