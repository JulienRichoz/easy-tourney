// models/game.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      Game.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
      Game.belongsTo(models.Pool, { foreignKey: 'poolId', as: 'pool' });
      Game.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
      Game.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });
      Game.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });
      Game.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
      Game.belongsTo(models.UsersTourneys, { foreignKey: 'assistantId', as: 'assistant' });
      Game.hasMany(models.GameEvent, { foreignKey: 'gameId', as: 'events' });
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
        onDelete: 'SET NULL',
      },
      teamAId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      teamBId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE',
      },
      fieldId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Fields', key: 'id' },
        onDelete: 'CASCADE',
      },
      sportId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'Sports', key: 'id' },
        onDelete: 'SET NULL',
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
    }
  );

  return Game;
};
