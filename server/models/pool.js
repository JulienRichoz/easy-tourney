// models/pool.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Pool extends Model {
    static associate(models) {
      // Associations
      Pool.belongsTo(models.Tourney, {
        foreignKey: 'tourneyId',
        as: 'tourney',
      });
      // Une Pool a plusieurs Équipes
      Pool.hasMany(models.Team, {
        foreignKey: 'poolId',
        as: 'teams',
        onDelete: 'SET NULL', // Si une Pool est supprimée, les équipes associées ne sont pas supprimées
        hooks: true, // Nécessaire pour que 'onDelete' soit appliqué
      });
      Pool.hasMany(models.PoolSchedule, {
        foreignKey: 'poolId',
        as: 'schedules',
        onDelete: 'CASCADE', // Si une Pool est supprimée, les horaires associés sont supprimés
        hooks: true,
      });
      Pool.hasMany(models.Game, {
        foreignKey: 'poolId',
        as: 'games',
        onDelete: 'CASCADE',
        hooks: true, // Nécessaire pour que 'onDelete' soit appliqué
      });
    }
  }

  Pool.init(
    {
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
    },
    {
      sequelize,
      modelName: 'Pool',
    }
  );

  return Pool;
};
