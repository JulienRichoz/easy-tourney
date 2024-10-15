// server/models/sportsFields.js
// Purpose: Define the sportsFields model and its associations

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SportsFields extends Model {
        static associate(models) {
            SportsFields.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });
            SportsFields.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
        }
    }

    SportsFields.init({
        startTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        endTime: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        information: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'SportsFields',
    });

    return SportsFields;
};
