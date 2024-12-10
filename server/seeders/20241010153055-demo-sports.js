// seeders/xxx_demo-sports.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Sports', [
      {
        name: 'Basketball',
        rule: 'https://www.beasebasket.com/conseils-actualites/entrainement-blog/les-principales-regles-du-basketball',
        scoreSystem: 'DESC',
        color: '#FF5733',
        image: '/uploads/basketball.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Football',
        rule: 'https://www.monequipementsport.fr/dossier/reglement-du-football.html',
        scoreSystem: 'DESC',
        color: '#028d1c',
        image: '/uploads/football.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Volleyball',
        rule: 'https://www.sisteronvolley.fr/les-regles-du-volley/',
        scoreSystem: 'DESC',
        color: '#FFC300',
        image: '/uploads/volleyball.jpeg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Ultimate',
        rule: 'https://www.ff-flyingdisc.fr/les-regles-du-jeu/',
        scoreSystem: 'DESC',
        color: '#8E44AD',
        image: '/uploads/ultimate.jpeg',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Badminton',
        rule: 'https://acgb.ch/les-regles-du-badminton/',
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
