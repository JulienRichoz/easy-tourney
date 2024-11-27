// models/game.js
const { Model } = require('sequelize');
const tourneyTypes = require('../config/tourneyTypes');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      Game.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney', });
      Game.belongsTo(models.Pool, { foreignKey: 'poolId', as: 'pool' });
      Game.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
      Game.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });
      Game.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });
      Game.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
      Game.belongsTo(models.UsersTourneys, { foreignKey: 'assistantId', as: 'assistant' });
      Game.hasMany(models.GameEvent, { foreignKey: 'gameId', as: 'events' });
      Game.belongsTo(models.PoolSchedule, { foreignKey: 'poolScheduleId', as: 'poolSchedule' });
    }
  }

  Game.init(
    {
      tourneyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Tourneys', key: 'id' },
        onDelete: 'CASCADE',
      },
      poolId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Pools', key: 'id' },
        onDelete: 'CASCADE', // If a Pool is deleted, delete all associated Games
      },
      poolScheduleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'PoolSchedules', key: 'id' },
        onDelete: 'CASCADE', // If a PoolSchedule is deleted, delete all associated Games
      },
      teamAId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE', // If a Team is deleted, delete all associated Games
      },
      teamBId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE', // If a Team is deleted, delete all associated Games
      },
      fieldId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Fields', key: 'id' },
        onDelete: 'CASCADE', // If a Field is deleted, delete all associated Games
      },
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Sports', key: 'id' },
        onDelete: 'CASCADE', // If a Sport is deleted, delete all associated Games
      },
      startTime: { type: DataTypes.DATE, allowNull: false },
      endTime: { type: DataTypes.DATE, allowNull: false },
      status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      scoreTeamA: { type: DataTypes.INTEGER, allowNull: true },
      scoreTeamB: { type: DataTypes.INTEGER, allowNull: true },
      assistantId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'UsersTourneys', key: 'id' },
        onDelete: 'SET NULL',
      },
    },
    {
      sequelize,
      modelName: 'Game',
      validate: {
        teamsMustBeDifferent() {
          if (this.teamAId === this.teamBId) {
            throw new Error("L'équipe A et l'équipe B doivent être différentes.");
          }
        },
      },
    }
  );
  return Game;
};
