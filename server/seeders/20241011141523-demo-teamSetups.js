// seeders/xxx_demo-teamSetups.js
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
      await queryInterface.bulkInsert('TeamSetups', [
        {
          tourneyId: tourneys[0].id,
          maxTeamNumber: 5,
          playerPerTeam: 4,
          minPlayerPerTeam: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('TeamSetups', null, {});
  }
};
