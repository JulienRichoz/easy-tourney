'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fields = await queryInterface.sequelize.query(
      'SELECT id FROM `Fields`;',
      {
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (fields.length > 0) {
      await queryInterface.bulkInsert('sportsFields', [
        {
          fieldId: fields[0].id,
          sportId: 1, // Basketball
          startTime: '08:00',
          endTime: '12:00',
          information: 'Match de qualification',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fieldId: fields[1].id,
          sportId: 3, // Volleyball
          startTime: '10:00',
          endTime: '13:00',
          information: 'Phase éliminatoire',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          fieldId: fields[2].id,
          sportId: 5, // Badminton
          startTime: '09:00',
          endTime: '11:00',
          information: 'Tournoi en simple',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('sportsFields', null, {});
  },
};
