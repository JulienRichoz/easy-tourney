const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Team extends Model {
        static associate(models) {
            // Une équipe appartient à un tournoi
            Team.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
            // Une équipe peut avoir plusieurs utilisateurs
            Team.hasMany(models.User, { foreignKey: 'teamId' });
        }
    }

    Team.init({
        teamName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('player', 'assistant', 'guest'),
            allowNull: false,
            defaultValue: 'player',
        },
    }, {
        sequelize,
        modelName: 'Team',
    });

    return Team;
};
