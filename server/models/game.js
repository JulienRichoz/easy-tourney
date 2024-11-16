const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      // Association avec le tournoi
      Game.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });

      // Association avec les pools
      Game.belongsTo(models.Pool, { foreignKey: 'poolId', as: 'pool' });

      // Association avec les équipes
      Game.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
      Game.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });

      // Association avec le terrain
      Game.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });

      // Association avec le sport
      Game.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });

      // Association avec l'arbitre
      Game.belongsTo(models.User, { foreignKey: 'refereeId', as: 'referee' });

      // Association avec les événements
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
        references: { model: 'UsersTourneys', key: 'id' }, // Utilise UsersTourneys
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
