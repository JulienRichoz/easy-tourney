// seeders/xxx_demo-scheduleTourneys.js
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
      await queryInterface.bulkInsert('ScheduleTourneys', [
        {
          tourneyId: tourneys[0].id,
          startTime: '08:00',
          endTime: '18:00',
          introductionStartTime: '08:00',
          introductionEndTime: '08:30',
          lunchStartTime: '12:00',
          lunchEndTime: '13:00',
          outroStartTime: '17:30',
          outroEndTime: '18:00',
          timeMatchRotation: 60,
          timePoolRotation: 120,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ScheduleTourneys', null, {});
  },
};
