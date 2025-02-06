// seeders/xxx_demo-tourneys.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {

    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

    await queryInterface.bulkInsert('Tourneys', [
      {
        name: 'High Tournament',
        location: "Chem. de l'Abbé-Freeley 6, 1700 Fribourg",
        latitude: 46.8166,
        longitude: 7.15369,
        dateTourney: today || '2024-11-15',
        emergencyDetails: 'Contact: High Admin, Tel: 123456789',
        tourneyType: 'customRoundRobin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        maxNumberOfPools: 9,
        defaultMinTeamPerPool: 4,
        defaultMaxTeamPerPool: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Mid Tournament',
        location: "Chem. de l'Abbé-Freeley 6, 1700 Fribourg",
        latitude: 46.8166,
        longitude: 7.15369,
        dateTourney: today || '2024-11-16',
        emergencyDetails: 'Contact: Mid Admin, Tel: 987654321',
        tourneyType: 'customRoundRobin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        maxNumberOfPools: 4,
        defaultMinTeamPerPool: 3,
        defaultMaxTeamPerPool: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Low Tournament',
        location: "Chem. de l'Abbé-Freeley 6, 1700 Fribourg",
        latitude: 46.8166,
        longitude: 7.15369,
        dateTourney: today || '2024-11-17',
        emergencyDetails: 'Contact: Low Admin, Tel: 555555555',
        tourneyType: 'customRoundRobin',
        status: 'draft',
        fieldAssignmentStatus: 'draft',
        sportAssignmentStatus: 'draft',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        maxNumberOfPools: 2,
        defaultMinTeamPerPool: 2,
        defaultMaxTeamPerPool: 4,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Tournoi de Printemps',
        location: "Chem. de l'Abbé-Freeley 6, 1700 Fribourg",
        latitude: 46.8166,
        longitude: 7.15369,
        dateTourney: today || '2024-11-15',
        emergencyDetails: 'Contact: John Doe, Tel: 123456789',
        tourneyType: 'customRoundRobin',
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
