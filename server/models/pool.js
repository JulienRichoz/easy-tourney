// models/pool.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pool extends Model {
    static associate(models) {
      // Associations
      Pool.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
      Pool.hasMany(models.Team, { foreignKey: 'poolId', as: 'teams' });
    }
  }

  Pool.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tourneyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Pool',
  });

  return Pool;
};
