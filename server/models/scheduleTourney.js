const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ScheduleTourney extends Model {
        static associate(models) {
            ScheduleTourney.belongsTo(models.Tourney, { foreignKey: 'tourneyId' });
        }
    }

    ScheduleTourney.init({
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        introductionTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        lunchTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        outroTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        timeMatchRotation: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        timePoolRotation: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    }, {
        sequelize,
        modelName: 'ScheduleTourney',
    });

    return ScheduleTourney;
};
