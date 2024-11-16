// migrations/create-scheduleTourney.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ScheduleTourneys', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tourneyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tourneys', // Nom de la table de référence
          key: 'id',
        },
        onUpdate: 'CASCADE', // Si le tournoi est mis à jour, le planning est mis à jour
        onDelete: 'CASCADE', // Si le tournoi est supprimé, le planning est supprimé
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      introStart: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      introEnd: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      lunchStart: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      lunchEnd: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      outroStart: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      outroEnd: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      timeMatchRotation: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      timePoolRotation: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('ScheduleTourneys');
  },
};
