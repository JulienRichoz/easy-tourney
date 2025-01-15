// migrations/20241011120648-create-scheduleTourney.js
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
          model: 'Tourneys',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        unique: true,
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
      poolDuration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 120,
      },
      gameDuration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15,
      },
      transitionPoolTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 15,
      },
      transitionGameTime: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      useDefaultSettings: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
