// models/usersTourneys.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class UsersTourneys extends Model {
        static associate(models) {
            // Un utilisateur peut participer à plusieurs tournois et vice versa
            UsersTourneys.belongsTo(models.User, { foreignKey: 'userId' });
            UsersTourneys.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
        }
    }

    UsersTourneys.init(
        {
            userId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            tourneyId: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        },
        {
            sequelize,
            modelName: 'UsersTourneys',
            indexes: [
                {
                    unique: true,
                    fields: ['userId', 'tourneyId'], // Contrainte d'unicité sur la combinaison
                }
            ]
        }
    );

    return UsersTourneys;
};
