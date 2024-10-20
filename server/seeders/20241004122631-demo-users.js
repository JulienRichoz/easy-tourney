'use strict';

/** @type {import('sequelize-cli').Migration} */
const authService = require('../services/authService');


module.exports = {
  up: async (queryInterface, Sequelize) => {
    // const hashedPassword = 
    const weakPassword = await authService.hashPassword('a');
    await queryInterface.bulkInsert('Users', [
      { name: 'a', email: 'a@a.a', password: weakPassword, roleId: 1, teamId: null, createdAt: new Date(), updatedAt: new Date() }, // Pas d'équipe
      { name: 'Admin User', email: 'admin@example.com', password: await authService.hashPassword('password'), roleId: 1, teamId: null, createdAt: new Date(), updatedAt: new Date() }, // Admin sans équipe
      { name: 'Assistant User', email: 'assistant@example.com', password: await authService.hashPassword('password'), roleId: 2, teamId: 3, createdAt: new Date(), updatedAt: new Date() }, // Assistant dans l'équipe 3
      { name: 'Player User', email: 'player@example.com', password: await authService.hashPassword('password'), roleId: 3, teamId: 1, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1
      { name: 'Guest User', email: 'guest@example.com', password: await authService.hashPassword('password'), roleId: 4, teamId: 4, createdAt: new Date(), updatedAt: new Date() }  // Guest dans l'équipe 4
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
