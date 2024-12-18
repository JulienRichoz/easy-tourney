// models/user.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Un utilisateur appartient à un rôle
      User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });

      // Un utilisateur peut avoir plusieurs UsersTourneys
      User.hasMany(models.UsersTourneys, {
        foreignKey: 'userId',
        as: 'usersTourneys',
      });

      // Association avec les tournois via UsersTourneys (relation N-N)
      User.belongsToMany(models.Tourney, {
        through: 'UsersTourneys', // Table intermédiaire
        foreignKey: 'userId',
        otherKey: 'tourneyId',
        as: 'tourneys',
      });

      User.belongsToMany(models.Team, {
        through: models.UsersTourneys,
        foreignKey: 'userId',
        otherKey: 'teamId',
        as: 'teams',
      });
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        references: {
          model: 'Roles',
          key: 'id',
        },
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'Users',
    }
  );

  return User;
};
