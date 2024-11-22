// models/game.js
const { Model } = require('sequelize');
const tourneyTypes = require('../config/tourneyTypes');

module.exports = (sequelize, DataTypes) => {
  class Game extends Model {
    static associate(models) {
      Game.belongsTo(models.Tourney, {
        foreignKey: 'tourneyId',
        as: 'tourney',
      });
      Game.belongsTo(models.Pool, { foreignKey: 'poolId', as: 'pool' });
      Game.belongsTo(models.Team, { foreignKey: 'teamAId', as: 'teamA' });
      Game.belongsTo(models.Team, { foreignKey: 'teamBId', as: 'teamB' });
      Game.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });
      Game.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
      Game.belongsTo(models.UsersTourneys, {
        foreignKey: 'assistantId',
        as: 'assistant',
      });
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
      poolScheduleId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'PoolSchedules', key: 'id' },
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

  // Ajout du hook après l'initialisation
  // Vérifie qu'un 'poolId' est requis pour les tournois nécessitant des pools
  Game.addHook('beforeValidate', async (game, options) => {
    const { Team, Tourney, PoolSchedule } = sequelize.models;
    const tourney = await Tourney.findByPk(game.tourneyId);

    if (!tourney) {
      throw new Error("Le tournoi associé n'existe pas.");
    }

    const tourneyType = tourneyTypes[tourney.tourneyType];

    if (tourneyType && tourneyType.requiresPool) {
      if (!game.poolId) {
        throw new Error(
          "Un 'poolId' est requis pour les tournois nécessitant des pools."
        );
      }

      // Vérifier que les équipes appartiennent à la même Pool
      const teamA = await Team.findByPk(game.teamAId);
      const teamB = await Team.findByPk(game.teamBId);

      if (!teamA || !teamB) {
        throw new Error("Les équipes spécifiées n'existent pas.");
      }

      if (
        teamA.poolId !== game.poolId ||
        teamB.poolId !== game.poolId ||
        teamA.poolId !== teamB.poolId
      ) {
        throw new Error(
          "Les équipes doivent appartenir à la même Pool associée au match."
        );
      }

      // Si 'poolScheduleId' est fourni, vérifier qu'il correspond à 'poolId'
      if (game.poolScheduleId) {
        const poolSchedule = await PoolSchedule.findByPk(game.poolScheduleId);
        if (!poolSchedule) {
          throw new Error("La PoolSchedule spécifiée n'existe pas.");
        }
        if (poolSchedule.poolId !== game.poolId) {
          throw new Error(
            "La PoolSchedule doit appartenir à la même Pool que les équipes."
          );
        }
      }
    } else {
      // Pour les tournois sans pools, s'assurer que 'poolId' et 'poolScheduleId' sont nuls
      game.poolId = null;
      game.poolScheduleId = null;
    }
  });

  return Game;
};
