const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Tourney extends Model {
        static associate(models) {
            // Un tournoi a un planning, une configuration de teams et des terrains
            Tourney.hasOne(models.ScheduleTourney, { foreignKey: 'tourneyId', as: 'schedule' });
            Tourney.hasOne(models.TeamSetup, { foreignKey: 'tourneyId', as: 'teamSetup' });
            Tourney.hasMany(models.Field, { foreignKey: 'tourneyId', as: 'fields' });

            // Association avec les utilisateurs via UsersTourneys (relation N-N)
            Tourney.belongsToMany(models.User, {
                through: 'UsersTourneys', // Table intermédiaire
                foreignKey: 'tourneyId',
                otherKey: 'userId',
                as: 'users'
            });
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
            defaultValue: 'draft', // Par défaut, le tournoi est en état "draft"
        },
    }, {
        sequelize,
        modelName: 'Tourney',
    });

    return Tourney;
};
