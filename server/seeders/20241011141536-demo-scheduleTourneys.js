'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Récupérer les deux premiers tournois
    const tourneys = await queryInterface.sequelize.query(
      'SELECT id FROM `Tourneys` ORDER BY id ASC LIMIT 2;',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Vérifier si au moins deux tournois existent
    if (tourneys.length > 0) {
      const scheduleData = tourneys.map((tourney, index) => ({
        tourneyId: tourney.id,
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
      }));

      // Insérer les données pour les deux tournois
      await queryInterface.bulkInsert('ScheduleTourneys', scheduleData);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer toutes les données insérées par ce seeder
    await queryInterface.bulkDelete('ScheduleTourneys', null, {});
  },
};
