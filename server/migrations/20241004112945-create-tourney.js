// migrations/create-tourney.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tourneys', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateTourney: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emergencyDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'ready', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'draft',
      },
      fieldAssignmentStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },      
      sportAssignmentStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },
      registrationStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },
      planningStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
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
    await queryInterface.dropTable('Tourneys');
  }
};
