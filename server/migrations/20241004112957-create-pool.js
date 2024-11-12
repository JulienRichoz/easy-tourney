// migrations/create-pool.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Pools', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      tourneyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Tourneys',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      // Nombre max de team par pool
      maxTeamPerPool: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      // Nombre min de team par pool
      minTeamPerPool: {
          type: Sequelize.INTEGER,
          allowNull: true,
      },
      // Stade du tournoi selon type (demi-final, final, etc.)
      stage: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: true,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: true
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
    await queryInterface.dropTable('Pools');
  }
};