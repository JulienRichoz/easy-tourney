// seeders/xxx_demo-tourneys.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Tourneys', [
      {
        name: 'High Tournament',
        location: 'Stadium High',
        dateTourney: '2024-11-15',
        emergencyDetails: 'Contact: High Admin, Tel: 123456789',
        tourneyType: 'custom-round-robin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        defaultMinTeamPerPool: 4,
        defaultMaxTeamPerPool: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mid Tournament',
        location: 'Stadium Mid',
        dateTourney: '2024-11-16',
        emergencyDetails: 'Contact: Mid Admin, Tel: 987654321',
        tourneyType: 'custom-round-robin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        defaultMinTeamPerPool: 3,
        defaultMaxTeamPerPool: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Low Tournament',
        location: 'Stadium Low',
        dateTourney: '2024-11-17',
        emergencyDetails: 'Contact: Low Admin, Tel: 555555555',
        tourneyType: 'custom-round-robin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        defaultMinTeamPerPool: 2,
        defaultMaxTeamPerPool: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Tournoi de Printemps',
        location: 'Complexe Sportif de la Ville',
        dateTourney: '2024-11-15',
        emergencyDetails: 'Contact: John Doe, Tel: 123456789',
        tourneyType: 'custom-round-robin',

        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        defaultMinTeamPerPool: 2,
        defaultMaxTeamPerPool: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tourneys', null, {});
  },
};
