const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UsersTourneys extends Model {
        static associate(models) {
            // UsersTourneys appartient à User
            UsersTourneys.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            // UsersTourneys appartient à Tourney
            UsersTourneys.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
            // UsersTourneys appartient à Team
            UsersTourneys.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
        }
    }

    UsersTourneys.init({
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        tourneyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        teamId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        tourneyRole: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'guest',
        }
    }, {
        sequelize,
        modelName: 'UsersTourneys',
    });

    return UsersTourneys;
};
