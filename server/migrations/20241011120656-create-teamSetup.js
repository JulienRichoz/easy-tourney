// migrations/xxx-create-teamSetup.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TeamSetups', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tourneyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tourneys',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true, // Empêche plusieurs configurations pour un même tournoi
      },
      maxTeamNumber: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      playerPerTeam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      minPlayerPerTeam: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      playerEstimated: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TeamSetups');
  }
};
