const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.belongsTo(models.Role, { foreignKey: 'roleId' });
      User.belongsTo(models.Team, { foreignKey: 'teamId' }); // Association avec l'équipe
    }
  }

  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    teamId: DataTypes.INTEGER, // Ajout du champ teamId
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};
