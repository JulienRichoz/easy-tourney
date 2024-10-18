// server/models/sport.js
// Purpose: Define the Sport model and its associations

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Sport extends Model {
        static associate(models) {
            // Associer des relations si nécessaire
        }
    }

    Sport.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        rule: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        scoreSystem: {
            type: DataTypes.STRING,
            defaultValue: 'DESC',
        },
        image: {
            type: DataTypes.STRING,
            defaultValue: '/path/to/default-image.png',
        },
        color: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        sequelize,
        modelName: 'Sport',
    });

    return Sport;
};
