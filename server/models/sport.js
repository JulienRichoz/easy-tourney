const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Sport extends Model {
        static associate(models) {
            // Associez des relations si nécessaire (par exemple, Sport pourrait avoir des tournois associés)
        }
    }

    Sport.init({
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        rule: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        scoreSystem: {
            type: DataTypes.STRING,
        },
    }, {
        sequelize,
        modelName: 'Sport',
    });

    return Sport;
};
