// server/seeders/demo-team.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Teams', [
      {
        teamName: 'Team 1',
        type: 'player',
        tourneyId: 1, // Associe l'équipe au tournoi ayant l'ID 1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        teamName: 'Team 2',
        type: 'player',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        teamName: 'Assistant Team',
        type: 'assistant',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        teamName: 'Guest Team',
        type: 'guest',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Teams', null, {});
  }
};
