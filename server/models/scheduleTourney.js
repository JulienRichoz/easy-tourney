// models/ScheduleTourney.js

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ScheduleTourney extends Model {
    static associate(models) {
      ScheduleTourney.belongsTo(models.Tourney, {
        foreignKey: 'tourneyId',
        as: 'tourney',
      });
    }
  }

  ScheduleTourney.init(
    {
      tourneyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true, // Contrainte d'unicité
        references: {
          model: 'Tourneys',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      startTime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '07:30:00',
      },
      endTime: {
        type: DataTypes.TIME,
        allowNull: false,
        defaultValue: '17:30:00',
      },
      introStart: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '07:30:00',
      },
      introEnd: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '08:00:00',
      },
      lunchStart: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '12:00:00',
      },
      lunchEnd: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '13:00:00',
      },
      outroStart: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '17:00:00',
      },
      outroEnd: {
        type: DataTypes.TIME,
        allowNull: true,
        defaultValue: '17:30:00',
      },
      poolDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 105, // Durée par défaut d'une pool en minutes
      },
      gameDuration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15, // Durée par défaut d'une game en minutes
      },
      transitionPoolTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15, // Temps de transition par défaut en minutes
      },
      transitionGameTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0, // Temps de transition par défaut en minutes
      },
      useDefaultSettings: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'ScheduleTourney',
      hooks: {
        beforeCreate: (schedule) => {
          validateTimes(schedule);
        },
        beforeUpdate: (schedule) => {
          validateTimes(schedule);
        },
      },
    }
  );

  /**
   * Valider les plages horaires
   */
  function validateTimes(schedule) {
    const {
      startTime,
      endTime,
      introStart,
      introEnd,
      lunchStart,
      lunchEnd,
      outroStart,
      outroEnd,
    } = schedule;

    // Validation globale des horaires de début et de fin
    if (startTime >= endTime) {
      throw new Error(
        'L\'heure de fin doit être supérieure à l\'heure de début.'
      );
    }

    // Tableau des périodes optionnelles pour validation
    const timePairs = [
      { start: introStart, end: introEnd, label: 'Introduction' },
      { start: lunchStart, end: lunchEnd, label: 'Déjeuner' },
      { start: outroStart, end: outroEnd, label: 'Conclusion' },
    ];

    // Validation des plages horaires par rapport à la période globale
    for (const pair of timePairs) {
      if (pair.start && pair.end) {
        if (pair.start > pair.end) {
          throw new Error(
            `L'heure de début doit être inférieure à l'heure de fin pour la section ${pair.label}.`
          );
        }
        if (pair.start < startTime || pair.end > endTime) {
          throw new Error(
            `Les heures de début et de fin pour ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`
          );
        }
      }
    }
  }

  return ScheduleTourney;
};
