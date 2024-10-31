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
        }
    }

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
            allowNull: true,
        },
        planningStatus: {
            type: DataTypes.ENUM('notStarted', 'draft', 'completed'),
            defaultValue: 'notStarted',
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Tourney',
    });

    return Tourney;
};
