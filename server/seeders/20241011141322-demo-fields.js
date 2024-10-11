'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tourneys = await queryInterface.sequelize.query(
      'SELECT id FROM `Tourneys` WHERE name = "Tournoi de Printemps";',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (tourneys.length > 0) {
      await queryInterface.bulkInsert('Fields', [
        {
          name: 'Terrain 1',
          description: 'Grand terrain de basket',
          tourneyId: tourneys[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Terrain 2',
          description: 'Terrain de volleyball extérieur',
          tourneyId: tourneys[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          name: 'Terrain 3',
          description: 'Court de badminton',
          tourneyId: tourneys[0].id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Fields', null, {});
  },
};
