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
          introStart: '08:00',
          introEnd: '08:30',
          lunchStart: '12:00',
          lunchEnd: '13:00',
          outroStart: '17:30',
          outroEnd: '18:00',
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
