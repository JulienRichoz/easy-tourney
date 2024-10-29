// models/user.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Association avec le rôle
      User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });

      // Association avec l'équipe
      User.belongsTo(models.Team, { foreignKey: 'teamId' });

      // Association avec les tournois via UsersTourneys (relation N-N)
      User.belongsToMany(models.Tourney, {
        through: 'UsersTourneys', // Table intermédiaire
        foreignKey: 'userId',
        otherKey: 'tourneyId',
        as: 'tourneys'
      });
    }
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    phone: DataTypes.STRING,
    roleId: {
      type: DataTypes.INTEGER,
      defaultValue: 4, // Role Guest par défault si aucun role spécifié
    },
    teamId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
