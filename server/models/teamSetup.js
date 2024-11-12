// server/models/teamSetup.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TeamSetup extends Model {
        static associate(models) {
            TeamSetup.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
        }
    }

    TeamSetup.init({
        // Nombre max. d'équipes dans ce tournoi
        maxTeamNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Nombre max de joueurs par team
        playerPerTeam: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Nombre min de joueurs par team pour en valider une
        minPlayerPerTeam: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, 
    {
        sequelize,
        modelName: 'TeamSetup',
    });

    return TeamSetup;
};
