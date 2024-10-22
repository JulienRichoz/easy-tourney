// seeders/xxx_demo-sports.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Sports', [
      {
        name: 'Basketball',
        rule: 'Règles de basketball...',
        scoreSystem: 'DESC',
        color: '#FF5733',
        image: '/uploads/basketball.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Football',
        rule: 'Règles de football...',
        scoreSystem: 'DESC',
        color: '#028d1c',
        image: '/uploads/football.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Volleyball',
        rule: 'Règles de volleyball...',
        scoreSystem: 'DESC',
        color: '#FFC300',
        image: '/uploads/volleyball.jpeg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ultimate',
        rule: 'Règles de ultimate...',
        scoreSystem: 'DESC',
        color: '#8E44AD',
        image: '/uploads/ultimate.jpeg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Badminton',
        rule: 'Règles de badminton...',
        scoreSystem: 'DESC',
        color: '#33A1FF',
        image: '/uploads/badminton.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Sports', null, {});
  },
};
