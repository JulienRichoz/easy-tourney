// migrations/create-games.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Games', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tourneyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Tourneys', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      poolId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Pools', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      poolScheduleId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'PoolSchedules', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      teamAId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      teamBId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Teams', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      fieldId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Fields', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      sportId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'Sports', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      startTime: { type: Sequelize.DATE, allowNull: false },
      endTime: { type: Sequelize.DATE, allowNull: false },
      status: {
        type: Sequelize.ENUM('scheduled', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      scoreTeamA: { type: Sequelize.INTEGER, allowNull: true },
      scoreTeamB: { type: Sequelize.INTEGER, allowNull: true },
      assistantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'UsersTourneys', key: 'id' },
        onDelete: 'SET NULL',
      },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Games');
  },
};
