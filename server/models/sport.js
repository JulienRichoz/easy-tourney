// models/sport.js
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Sport extends Model {
        static associate(models) {
            // Associez des relations si nécessaire
        }
    }

    Sport.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ajout de la contrainte d'unicité
        },
        rule: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        scoreSystem: {
            type: DataTypes.STRING,
        },
        image: {
            type: DataTypes.STRING, // URL de l'image
            defaultValue: '/path/to/default-image.png', // Image par défaut
        },
        color: {
            type: DataTypes.STRING, // Hexadecimal pour la couleur
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Sport',
    });

    return Sport;
};
