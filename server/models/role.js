// models/role.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // Une role a plusieurs utilisateurs
      Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
    }
  }

  Role.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: 'Role',
      tableName: 'Roles',
    }
  );

  return Role;
};
