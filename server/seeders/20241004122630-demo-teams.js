// server/seeders/xxx-demo-teams.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Teams', [

      {
        teamName: 'Assistant',
        type: 'assistant',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        teamName: 'Team 1',
        type: 'player',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        teamName: 'Team 2',
        type: 'player',
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
