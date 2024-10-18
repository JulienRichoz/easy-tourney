'use strict';

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password', 10);
    await queryInterface.bulkInsert('Users', [
      { name: 'a', email: 'a@a.a', password: await bcrypt.hash('a', 10), roleId: 1, teamId: null, createdAt: new Date(), updatedAt: new Date() }, // Pas d'équipe
      { name: 'Admin User', email: 'admin@example.com', password: hashedPassword, roleId: 1, teamId: null, createdAt: new Date(), updatedAt: new Date() }, // Admin sans équipe
      { name: 'Assistant User', email: 'assistant@example.com', password: hashedPassword, roleId: 2, teamId: 3, createdAt: new Date(), updatedAt: new Date() }, // Assistant dans l'équipe 3
      { name: 'Player User', email: 'player@example.com', password: hashedPassword, roleId: 3, teamId: 1, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1
      { name: 'Guest User', email: 'guest@example.com', password: hashedPassword, roleId: 4, teamId: 4, createdAt: new Date(), updatedAt: new Date() }  // Guest dans l'équipe 4
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
