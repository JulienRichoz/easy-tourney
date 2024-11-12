// seeders/xxx_demo-sportsFields.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Récupérer tous les terrains et les sports disponibles
    const fields = await queryInterface.sequelize.query(
      'SELECT id, tourneyId FROM `Fields`;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const sports = await queryInterface.sequelize.query(
      'SELECT id FROM `Sports`;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const sportsFields = [];
    if (fields.length > 0 && sports.length > 0) {
      let sportIndex = 0; // Pour alterner les sports

      for (const field of fields) {
        sportsFields.push({
          fieldId: field.id,
          sportId: sports[sportIndex].id, // Associer un sport
          startTime: '08:00',
          endTime: '12:00',
          information: `Événement sur ${field.name}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        // Alterner les sports pour la prochaine insertion
        sportIndex = (sportIndex + 1) % sports.length;
      }

      // Insérer les données dans sportsFields
      await queryInterface.bulkInsert('sportsFields', sportsFields);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sportsFields', null, {});
  },
};
