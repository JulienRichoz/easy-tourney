// migrations/create-tourney.js
'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tourneys', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      location: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateTourney: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      domain: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      emergencyDetails: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      tourneyType: {
        type: Sequelize.ENUM(
            'knockout',            // Élimination directe : une seule défaite entraîne l'élimination (aussi appelé "bracket" ou "single-elimination")
            'double-knockout',     // Élimination double : deux défaites nécessaires pour être éliminé, généralement avec un "winner's bracket" et un "loser's bracket"
            'round-robin',         // Tous les participants jouent les uns contre les autres au moins une fois ; le gagnant est déterminé par le score total
            'swiss',               // Système suisse : les participants jouent plusieurs rondes contre des adversaires de niveau similaire, sans élimination
            'group-stage',         // Phase de groupes : les participants sont répartis en groupes pour un mini "round-robin", suivi de phases éliminatoires pour les meilleurs
            'ladder',              // Tournoi en escalier : les participants défient ceux au-dessus dans un classement ; le gagnant monte dans le classement
            'custom-round-robin'   // Variante de round-robin où chaque équipe doit jouer un nombre minimal de matchs contre des équipes différentes, à définir par le tourney
        ),
        allowNull: false,
        defaultValue: 'custom-round-robin'
    },
    defaultMaxTeamPerPool:{
        type: Sequelize.INTEGER,
        allowNull: true,
    },
    defaultMinTeamPerPool:{
        type: Sequelize.INTEGER,
        allowNull: true,
    },
      status: {
        type: Sequelize.ENUM('draft', 'ready', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'draft',
      },
      fieldAssignmentStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },      
      sportAssignmentStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },
      registrationStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },
      poolStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted',
      },
      planningStatus: {
        type: Sequelize.ENUM('notStarted', 'draft', 'completed'),
        allowNull: false,
        defaultValue: 'notStarted'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tourneys');
  }
};
