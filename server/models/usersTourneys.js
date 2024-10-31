// models/usersTourneys.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UsersTourneys extends Model {
        static associate(models) {
            // Un utilisateur appartient à un tournoi via UsersTourneys
            UsersTourneys.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
            UsersTourneys.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
            UsersTourneys.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
        }
    }

    UsersTourneys.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Users', key: 'id' },
            },
            tourneyId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Tourneys', key: 'id' },
            },
            teamId: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'Teams', key: 'id' },
            },
        },
        {
            sequelize,
            modelName: 'UsersTourneys',
            indexes: [
                {
                    unique: true,
                    fields: ['userId', 'tourneyId'],
                }
            ]
        }
    );

    return UsersTourneys;
};
