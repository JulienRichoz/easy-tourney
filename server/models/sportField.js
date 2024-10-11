const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class SportField extends Model {
        static associate(models) {
            SportField.belongsTo(models.Field, { foreignKey: 'fieldId', as: 'field' });
            SportField.belongsTo(models.Sport, { foreignKey: 'sportId', as: 'sport' });
        }
    }

    SportField.init({
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
        modelName: 'SportField',
    });

    return SportField;
};
