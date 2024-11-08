// seeders/xxx_demo-users.js
'use strict';

/** @type {import('sequelize-cli').Migration} */
const authService = require('../services/authService');


module.exports = {
  up: async (queryInterface, Sequelize) => {

    const weakPassword = await authService.hashPassword('a');
    // ID 1 (a) est un super admin. Il peut supprimer d'autres admin. Idée à developper par la suite
    await queryInterface.bulkInsert('Users', [
      { name: 'a', email: 'a@a.a', password: weakPassword, roleId: 1, phone: null, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Admin User', email: 'admin@example.com', password: await authService.hashPassword('password'), roleId: 1, phone: null, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Assistant User', email: 'assistant@example.com', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Assistant dans l'équipe Assistant

      { name: 'John A', email: 'john@a.a', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1
      { name: 'Julien A', email: 'julien@a.a', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1
      { name: 'Polo A', email: 'polo@a.a', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1
      { name: 'Ali A', email: 'ali@a.a', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 1

      { name: 'Michel B', email: 'michel@a.b', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 2
      { name: 'Larissa B', email: 'larissa@b.b', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 2
      { name: 'Jordan B', email: 'jordan@b.b', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 2
      { name: 'Alex A', email: 'alex@b.b', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }, // Joueur dans l'équipe 2


      { name: 'Guest User', email: 'guest@example.com', password: await authService.hashPassword('password'), roleId: 2, phone: null, createdAt: new Date(), updatedAt: new Date() }  // Guest dans l'équipe 4
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
