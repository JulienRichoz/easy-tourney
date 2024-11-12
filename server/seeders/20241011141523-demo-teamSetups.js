// seeders/xxx_demo-teamSetups.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tourneys = await queryInterface.sequelize.query(
      'SELECT id FROM `Tourneys`;',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    const teamSetups = tourneys.map((tourney) => ({
      tourneyId: tourney.id,
      maxTeamNumber: 20,
      playerPerTeam: 4,
      minPlayerPerTeam: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await queryInterface.bulkInsert('TeamSetups', teamSetups);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('TeamSetups', null, {});
  },
};
