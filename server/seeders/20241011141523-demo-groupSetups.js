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
      await queryInterface.bulkInsert('GroupSetups', [
        {
          tourneyId: tourneys[0].id,
          maxGroupNumber: 10,
          playerPerGroup: 5,
          playerEstimated: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('GroupSetups', null, {});
  },
};
