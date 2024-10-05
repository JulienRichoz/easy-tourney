'use strict';

/** @type {import('sequelize-cli').Migration} */
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password', 10);
    await queryInterface.bulkInsert('Users', [
      { name: 'Admin User', email: 'admin@example.com', password: hashedPassword, roleId: 1, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Assistant User', email: 'assistant@example.com', password: hashedPassword, roleId: 2, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Player User', email: 'player@example.com', password: hashedPassword, roleId: 3, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Guest User', email: 'guest@example.com', password: hashedPassword, roleId: 4, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};