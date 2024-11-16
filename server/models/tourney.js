// models/tourney.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Tourney extends Model {
        static associate(models) {
            // Un tournoi a un planning, une configuration de teams et des terrains
            Tourney.hasOne(models.ScheduleTourney, { foreignKey: 'tourneyId', as: 'schedule' });
            Tourney.hasOne(models.TeamSetup, { foreignKey: 'tourneyId', as: 'teamSetup' });
            Tourney.hasMany(models.Field, {
                foreignKey: 'tourneyId',
                as: 'fields',
                onDelete: 'CASCADE', // Supprimer les terrains si le tournoi est supprimé
            });
            Tourney.hasMany(models.Pool, {
                foreignKey: 'tourneyId',
                as: 'pools',
                onDelete: 'CASCADE', // Supprimer les pools si le tournoi est supprimé
            });
            // Association avec Team
            Tourney.hasMany(models.Team, { as: 'teams', foreignKey: 'tourneyId' });

            // Association avec les utilisateurs via UsersTourneys (relation N-N)
            Tourney.belongsToMany(models.User, {
                through: models.UsersTourneys, // Table intermédiaire
                foreignKey: 'tourneyId',
                otherKey: 'userId',
                as: 'users'
            });

            // Association inverse pour accéder aux UsersTourneys
            Tourney.hasMany(models.UsersTourneys, { foreignKey: 'tourneyId', as: 'usersTourneys' });

            // Association pour accéder aux tokens d'invitation
            Tourney.hasMany(models.InviteToken, {
                foreignKey: 'tourneyId',
                as: 'inviteTokens',
                onDelete: 'CASCADE',
            });
        };
    };

    Tourney.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        location: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dateTourney: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        domain: {
            type: DataTypes.STRING,
            allowNull: true, // Optionnel
        },
        emergencyDetails: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        tourneyType: {
            type: DataTypes.ENUM(
                'knockout',            // Élimination directe : une seule défaite entraîne l'élimination (aussi appelé "bracket" ou "single-elimination")
                'doubleKnockout',     // Élimination double : deux défaites nécessaires pour être éliminé, généralement avec un "winner's bracket" et un "loser's bracket"
                'roundRobin',         // Tous les participants jouent les uns contre les autres au moins une fois ; le gagnant est déterminé par le score total
                'swiss',               // Système suisse : les participants jouent plusieurs rondes contre des adversaires de niveau similaire, sans élimination
                'groupStage',         // Phase de groupes : les participants sont répartis en groupes pour un mini "round-robin", suivi de phases éliminatoires pour les meilleurs
                'ladder',              // Tournoi en escalier : les participants défient ceux au-dessus dans un classement ; le gagnant monte dans le classement
                'customRoundRobin'   // Variante de round-robin où chaque équipe doit jouer un nombre minimal de matchs contre des équipes différentes, à définir par le tourney
            ),
            allowNull: false,
            defaultValue: 'customRoundRobin'
        },
        maxNumberOfPools:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        defaultMaxTeamPerPool:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        defaultMinTeamPerPool:{
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'ready', 'active', 'completed'),
            allowNull: false,
            defaultValue: 'draft',
        },
        fieldAssignmentStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'completed'),
            defaultValue: 'notStarted',
            allowNull: false,
        },
        sportAssignmentStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'completed'),
            defaultValue: 'notStarted',
            allowNull: false,
        },
        registrationStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'active', 'completed'),
            defaultValue: 'notStarted',
            allowNull: false,
        },
        poolStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'completed'),
            defaultValue: 'notStarted',
            allowNull: false,
        },
        planningStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'completed'),
            defaultValue: 'notStarted',
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'Tourney',
    });

    return Tourney;
};
