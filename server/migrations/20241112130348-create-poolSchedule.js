// migrations/create-poolSchedule.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('PoolSchedules', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      poolId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Pools',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      fieldId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Fields',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      sportId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Sports',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      date: {
        type: Sequelize.DATEONLY,
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
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('PoolSchedules');
  },
};
