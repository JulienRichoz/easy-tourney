// models/field.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Field extends Model {
        static associate(models) {
            Field.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
            Field.hasMany(models.SportField, { foreignKey: 'fieldId', as: 'sportFields' }); // Un terrain peut avoir plusieurs sports associés
        }
    }

    Field.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Field',
    });

    return Field;
};
