// server/models/teamSetup.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TeamSetup extends Model {
        static associate(models) {
            TeamSetup.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
        }
    }

    TeamSetup.init({
        maxTeamNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        playerPerTeam: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        playerEstimated: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'TeamSetup',
    });

    return TeamSetup;
};
