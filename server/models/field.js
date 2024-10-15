// server/models/field.js
// Modèle pour la gestion des terrains

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Field extends Model {
        static associate(models) {
            Field.belongsTo(models.Tourney, { foreignKey: 'tourneyId', as: 'tourney' });
            Field.hasMany(models.SportsFields, { foreignKey: 'fieldId', as: 'sportsFields' }); // Un terrain peut avoir plusieurs sports associés
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
