'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const teams = [];

    // Assistant teams
    teams.push({
      id: 1,
      teamName: 'Assistant',
      type: 'assistant',
      tourneyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    teams.push({
      id: 2,
      teamName: 'Assistant',
      type: 'assistant',
      tourneyId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    teams.push({
      id: 3,
      teamName: 'Assistant',
      type: 'assistant',
      tourneyId: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let teamId = 4;

    // Teams for High Tournament
    for (let i = 0; i < 50; i++) {
      teams.push({
        id: teamId++,
        teamName: `High Team ${i + 1}`,
        type: 'player',
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Teams for Mid Tournament
    for (let i = 0; i < 15; i++) {
      teams.push({
        id: teamId++,
        teamName: `Mid Team ${i + 1}`,
        type: 'player',
        tourneyId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Teams for Low Tournament
    for (let i = 0; i < 4; i++) {
      teams.push({
        id: teamId++,
        teamName: `Low Team ${i + 1}`,
        type: 'player',
        tourneyId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('Teams', teams);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Teams', null, {});
  },
};
