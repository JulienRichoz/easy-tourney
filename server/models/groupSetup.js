const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class GroupSetup extends Model {
        static associate(models) {
            GroupSetup.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
        }
    }

    GroupSetup.init({
        maxGroupNumber: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        playerPerGroup: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        playerEstimated: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'GroupSetup',
    });

    return GroupSetup;
};
