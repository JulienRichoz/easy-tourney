'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tourneys = await queryInterface.sequelize.query(
      'SELECT id FROM `Tourneys` ORDER BY id ASC LIMIT 2;',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (tourneys.length > 0) {
      const scheduleData = tourneys.map((tourney) => ({
        tourneyId: tourney.id,
        startTime: '07:30',
        endTime: '17:30',
        introStart: '07:30',
        introEnd: '08:00',
        lunchStart: '12:00',
        lunchEnd: '13:00',
        outroStart: '17:00',
        outroEnd: '17:30',
        poolDuration: 105,
        gameDuration: 15,
        transitionPoolTime: 15,
        transitionGameTime: 5,
        useDefaultSettings: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await queryInterface.bulkInsert('ScheduleTourneys', scheduleData);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('ScheduleTourneys', null, {});
  },
};
