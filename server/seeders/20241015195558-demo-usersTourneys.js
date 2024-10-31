// seeders/XXX-demo-usersTourneys.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('UsersTourneys', [
      {
        userId: 1,
        tourneyId: 1,
        teamId: null, // Guest
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 2,
        tourneyId: 1,
        teamId: null, // Admin
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3,
        tourneyId: 1,
        teamId: 1, // Assistant dans l'équipe Assistant
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 4,
        tourneyId: 1,
        teamId: 2, // Joueur dans l'équipe 1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 5,
        tourneyId: 1,
        teamId: 2, // Joueur dans l'équipe 1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 6,
        tourneyId: 1,
        teamId: 2, // Joueur dans l'équipe 1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 7,
        tourneyId: 1,
        teamId: 2, // Joueur dans l'équipe 1
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 8,
        tourneyId: 1,
        teamId: 3, // Joueur dans l'équipe 2
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 9,
        tourneyId: 1,
        teamId: 3, // Joueur dans l'équipe 2
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 10,
        tourneyId: 1,
        teamId: 3, // Joueur dans l'équipe 2
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 11,
        tourneyId: 1,
        teamId: 3, // Joueur dans l'équipe 2
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('UsersTourneys', null, {});
  },
};
