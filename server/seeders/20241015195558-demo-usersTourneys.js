// seeders/20241015195558-demo-usersTourneys.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const usersTourneys = [];

    // Admin user in all tournaments
    for (let tourneyId = 1; tourneyId <= 3; tourneyId++) {
      usersTourneys.push({
        userId: 1, // Admin user
        tourneyId,
        teamId: null,
        tourneyRole: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Assistant
    usersTourneys.push({
      userId: 280, // High Assistant
      tourneyId: 1,
      teamId: 1,
      tourneyRole: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
    });


    let teamId = 4; // Start from teamId 4 (after assistants)

    // High Tournament
    // Assistant
    usersTourneys.push({
      userId: 2, // High Assistant
      tourneyId: 1,
      teamId: 1,
      tourneyRole: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let userId = 5; // High Users start from ID 5

    // Players for High Tournament
    for (let i = 0; i < 200; i++) {
      usersTourneys.push({
        userId: userId++,
        tourneyId: 1,
        teamId: teamId,
        tourneyRole: 'player',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if ((i + 1) % 4 === 0) {
        teamId++;
      }
    }

    // Mid Tournament
    // Assistant
    usersTourneys.push({
      userId: 3, // Mid Assistant
      tourneyId: 2,
      teamId: 2,
      tourneyRole: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    userId = 205; // Mid Users start from ID 205

    // Players for Mid Tournament
    for (let i = 0; i < 60; i++) {
      usersTourneys.push({
        userId: userId++,
        tourneyId: 2,
        teamId: teamId,
        tourneyRole: 'player',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if ((i + 1) % 4 === 0) {
        teamId++;
      }
    }

    // Low Tournament
    // Assistant
    usersTourneys.push({
      userId: 4, // Low Assistant
      tourneyId: 3,
      teamId: 3,
      tourneyRole: 'assistant',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    userId = 265; // Low Users start from ID 265

    // Players for Low Tournament
    for (let i = 0; i < 15; i++) {
      usersTourneys.push({
        userId: userId++,
        tourneyId: 3,
        teamId: teamId,
        tourneyRole: 'player',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      if ((i + 1) % 4 === 0) {
        teamId++;
      }
    }

    await queryInterface.bulkInsert('UsersTourneys', usersTourneys);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('UsersTourneys', null, {});
  },
};
