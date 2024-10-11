'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Tourneys', [
      {
        name: 'Tournoi de Printemps',
        location: 'Complexe Sportif de la Ville',
        dateTourney: '2024-11-15',
        numberOfField: 3,
        emergencyDetails: 'Contact: John Doe, Tel: 123456789',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tourneys', null, {});
  },
};
