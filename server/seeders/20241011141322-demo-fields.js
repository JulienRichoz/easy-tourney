'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const fields = [];

    // Fields for High Tournament
    for (let i = 1; i <= 5; i++) {
      fields.push({
        name: `Terrain ${i}`,
        tourneyId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Fields for Mid Tournament
    for (let i = 1; i <= 4; i++) {
      fields.push({
        name: `Terrain ${i}`,
        tourneyId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Fields for Low Tournament
    for (let i = 1; i <= 2; i++) {
      fields.push({
        name: `Terrain ${i}`,
        tourneyId: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('Fields', fields);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Fields', null, {});
  },
};
