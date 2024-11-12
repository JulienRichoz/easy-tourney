// models/pool.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pool extends Model {
    static associate(models) {
      // Associations
      Pool.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
      Pool.hasMany(models.Team, { foreignKey: 'poolId', as: 'teams' });
      Pool.hasMany(models.PoolSchedule, { foreignKey: 'poolId', as: 'schedules' });
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
    // Nombre max de team par pool
    maxTeamPerPool: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Nombre min de team par pool
    minTeamPerPool: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    // Stade du tournoi selon type (demi-final, final, etc.)
    stage: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Pool',
  });

  return Pool;
};
