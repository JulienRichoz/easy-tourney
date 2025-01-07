'use strict';

const authService = require('../services/authService');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // "2025-01-07" par ex.

    // 1. Récupérer les derniers IDs existants
    const [lastUser] = await queryInterface.sequelize.query(
      'SELECT MAX(id) AS maxId FROM Users;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const nextUserId = lastUser.maxId ? lastUser.maxId + 1 : 1;

    const [lastTeam] = await queryInterface.sequelize.query(
      'SELECT MAX(id) AS maxId FROM Teams;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const nextTeamId = lastTeam.maxId ? lastTeam.maxId + 1 : 1;

    const [lastField] = await queryInterface.sequelize.query(
      'SELECT MAX(id) AS maxId FROM Fields;',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const nextFieldId = lastField.maxId ? lastField.maxId + 1 : 1;

    // 2. Insérer le tournoi
    await queryInterface.bulkInsert('Tourneys', [
      {
        name: 'Joutes Saint-Michel 2025',
        location: "Chem. de l'Abbé-Freeley 6, 1700 Fribourg",
        latitude: 46.8166,
        longitude: 7.15369,
        dateTourney: today,
        emergencyDetails: 'Urgences: +144, Responsable: 123456789',
        tourneyType: 'customRoundRobin',
        status: 'draft',
        fieldAssignmentStatus: 'completed',
        sportAssignmentStatus: 'completed',
        registrationStatus: 'draft',
        poolStatus: 'draft',
        planningStatus: 'notStarted',
        maxNumberOfPools: 10,
        defaultMinTeamPerPool: 4,
        defaultMaxTeamPerPool: 4,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const [tourney] = await queryInterface.sequelize.query(
      'SELECT id FROM Tourneys WHERE name = "Joutes Saint-Michel 2025";',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tourney || !tourney.id) {
      throw new Error("Impossible de récupérer l'ID du tournoi créé.");
    }
    const tourneyId = tourney.id;

    // 3. Création des équipes
    const teams = [];
    // Team 1: Assistant
    teams.push({
      id: nextTeamId,
      teamName: 'Assistant',
      type: 'assistant',
      tourneyId: tourneyId,
      createdAt: now,
      updatedAt: now,
    });

    // 40 équipes de type "player" (total 50 équipes)
    for (let i = 0; i < 40; i++) {
      teams.push({
        id: nextTeamId + i + 1,
        teamName: `Team ${i + 1}`,
        type: 'player',
        tourneyId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('Teams', teams);

    // 4. Création des utilisateurs (200 total)
    // 4.a. 10 "assistants"
    const userPassword = process.env.USER_PASSWORD || 'password';
    const hashedUserPassword = await authService.hashPassword(userPassword);

    const users = [];
    for (let i = 0; i < 10; i++) {
      users.push({
        id: nextUserId + i,
        name: `Assistant ${i + 1}`,
        email: `assistant${i + 1}@saintmichel.ch`,
        password: hashedUserPassword,
        roleId: 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 4.b. 190 "players"
    for (let i = 0; i < 190; i++) {
      users.push({
        id: nextUserId + 10 + i,
        name: `Demo ${i + 1}`,
        email: `demo${i + 1}@saintmichel.ch`,
        password: hashedUserPassword,
        roleId: 2,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('Users', users);

    // 5. Création des terrains
    const fields = [];
    for (let i = 0; i < 10; i++) {
      fields.push({
        id: nextFieldId + i,
        name: `Terrain ${i + 1}`,
        tourneyId: tourneyId,
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('Fields', fields);

    // 6. Configuration du tournoi
    await queryInterface.bulkInsert('TeamSetups', [
      {
        tourneyId: tourneyId,
        maxTeamNumber: 50,
        playerPerTeam: 5,
        minPlayerPerTeam: 3,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await queryInterface.bulkInsert('ScheduleTourneys', [
      {
        tourneyId: tourneyId,
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
        transitionGameTime: 0,
        useDefaultSettings: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 7. Ajout des sports
    await queryInterface.bulkInsert('Sports', [
      {
        name: 'Unihockey',
        rule: 'https://www.mobilesport.ch/unihockey-fr/unihockey-fairplay-de-la-tete-aux-pieds/',
        scoreSystem: 'DESC',
        color: '#FF69B4',
        image: '/uploads/unihockey.jpg',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // ----------------------------------------------------------------------
    // 9. Associer les 10 terrains à un sportId donné (2 créneaux chacun)
    //    Mapping: 1 & 6 -> basket(1), 2 & 7 -> foot(2), 3 & 8 -> volley(3),
    //             4 & 9 -> badminton(5), 5 & 10 -> unihockey(6)
    // ----------------------------------------------------------------------
    // Les terrains créés ont pour ID => (nextFieldId + i) => i de 0..9
    // Terrain n°1 => ID = nextFieldId
    // Terrain n°2 => ID = nextFieldId+1, etc.

    const sportMap = [1, 2, 3, 5, 6, 1, 2, 3, 5, 6];
    // index 0 => terrain 1 => basket(1)
    // index 1 => terrain 2 => foot(2)
    // index 2 => terrain 3 => volley(3)
    // index 3 => terrain 4 => badminton(5)
    // index 4 => terrain 5 => unihockey(6)
    // index 5 => terrain 6 => basket(1)
    // index 6 => terrain 7 => foot(2)
    // index 7 => terrain 8 => volley(3)
    // index 8 => terrain 9 => badminton(5)
    // index 9 => terrain 10 => unihockey(6)

    const sportsFields = [];
    for (let i = 0; i < 10; i++) {
      const fieldId = nextFieldId + i;
      const assignedSportId = sportMap[i];

      // Créneau matin
      sportsFields.push({
        fieldId: fieldId,
        sportId: assignedSportId,
        startTime: '08:00',
        endTime: '12:00',
        information: `Terrain ${i + 1} (matin)`,
        createdAt: now,
        updatedAt: now,
      });
      // Créneau après-midi
      sportsFields.push({
        fieldId: fieldId,
        sportId: assignedSportId,
        startTime: '13:00',
        endTime: '17:00',
        information: `Terrain ${i + 1} (après-midi)`,
        createdAt: now,
        updatedAt: now,
      });
    }
    await queryInterface.bulkInsert('SportsFields', sportsFields);


    // 8. Association des utilisateurs au tournoi (table UsersTourneys)
    const usersTourneys = [];

    // 8.a. Les 10 "assistant", tous dans la team "Assistant"
    for (let i = 0; i < 10; i++) {
      usersTourneys.push({
        userId: nextUserId + i,      // Les 10 assistant
        tourneyId: tourneyId,
        teamId: nextTeamId,         // Team "Assistant"
        tourneyRole: 'assistant',
        createdAt: now,
        updatedAt: now,
      });
    }

    // 8.b. 150 joueurs (sur 190) répartis par groupe de 4 dans les teams "player"
    let teamIndex = nextTeamId + 1; // la première team "player" est nextTeamId+1
    for (let i = 0; i < 150; i++) {
      usersTourneys.push({
        userId: nextUserId + 10 + i,  // players: de nextUserId+10 à nextUserId+159
        tourneyId: tourneyId,
        teamId: teamIndex,
        tourneyRole: 'player',
        createdAt: now,
        updatedAt: now,
      });
      // toutes les 4 insertions, on passe à l'équipe suivante
      if ((i + 1) % 4 === 0) teamIndex++;
    }

    // 8.c. Les 40 joueurs restants sans team => "guest"
    // (190 total - 150 = 40)
    for (let i = 150; i < 190; i++) {
      usersTourneys.push({
        userId: nextUserId + 10 + i,  // de nextUserId+160 à nextUserId+199
        tourneyId: tourneyId,
        teamId: null,
        tourneyRole: 'guest',
        createdAt: now,
        updatedAt: now,
      });
    }

    await queryInterface.bulkInsert('UsersTourneys', usersTourneys);
  },

  down: async (queryInterface, Sequelize) => {
    // Retrouve l'ID du tournoi créé
    const tourney = await queryInterface.sequelize.query(
      'SELECT id FROM Tourneys WHERE name = "Joutes Saint-Michel 2025";',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tourney.length) {
      const tourneyId = tourney[0].id;
      // Supprime d'abord les liaisons dépendantes
      await queryInterface.bulkDelete('UsersTourneys', { tourneyId });
      await queryInterface.bulkDelete('SportsFields', { tourneyId });
      await queryInterface.bulkDelete('ScheduleTourneys', { tourneyId });
      await queryInterface.bulkDelete('TeamSetups', { tourneyId });
      await queryInterface.bulkDelete('Fields', { tourneyId });
      await queryInterface.bulkDelete('Teams', { tourneyId });
      await queryInterface.bulkDelete('Tourneys', { id: tourneyId });
    }
  },
};
