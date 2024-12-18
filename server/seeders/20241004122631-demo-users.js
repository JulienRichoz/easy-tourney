// seeders/demo-users.js
'use strict';

const authService = require('../services/authService');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = [];
    const adminPassword = process.env.ADMIN_PASSWORD || 'a';
    const userPassword = process.env.USER_PASSWORD || 'password';

    // Hache les mots de passe à l'avance pour optimiser le temps d'exécution
    const hashedAdminPassword = await authService.hashPassword(adminPassword);
    const hashedUserPassword = await authService.hashPassword(userPassword);

    users.push({
      id: 1,
      name: 'a',
      email: 'a@a.a',
      password: hashedAdminPassword,
      roleId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User Assistant tournoi 1
    users.push({
      id: 1000,
      name: 'b',
      email: 'b@b.b',
      password: hashedUserPassword,
      roleId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Assistant users
    users.push({
      id: 2,
      name: 'High Assistant',
      email: 'highassistant@example.com',
      password: hashedUserPassword,
      roleId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    users.push({
      id: 3,
      name: 'Mid Assistant',
      email: 'midassistant@example.com',
      password: hashedUserPassword,
      roleId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    users.push({
      id: 4,
      name: 'Low Assistant',
      email: 'lowassistant@example.com',
      password: hashedUserPassword,
      roleId: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    let userId = 5;

    // Users for High Tournament
    for (let i = 1; i <= 200; i++) {
      users.push({
        id: userId++,
        name: `High User ${i}`,
        email: `highuser${i}@example.com`,
        password: hashedUserPassword,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Users for Mid Tournament
    for (let i = 1; i <= 60; i++) {
      users.push({
        id: userId++,
        name: `Mid User ${i}`,
        email: `miduser${i}@example.com`,
        password: hashedUserPassword,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Users for Low Tournament
    for (let i = 1; i <= 15; i++) {
      users.push({
        id: userId++,
        name: `Low User ${i}`,
        email: `lowuser${i}@example.com`,
        password: hashedUserPassword,
        roleId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};