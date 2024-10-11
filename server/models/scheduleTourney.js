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
        introductionStartTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        introductionEndTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        lunchStartTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        lunchEndTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        outroStartTime: {
            type: DataTypes.TIME,
            allowNull: true,
        },
        outroEndTime: {
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

        // Explications:
        // Utilisation des hooks 'beforeCreate' et 'beforeUpdate':
        // - Ces hooks permettent de valider les données avant la création ou la mise à jour d'un enregistrement.
        // - L'avantage est que la logique de validation est centralisée dans le modèle, ce qui garantit que les règles de validation sont toujours appliquées, même si les données proviennent de différentes sources (API, services, etc.).
        // - Cela permet également d'éviter la duplication de logique dans plusieurs endroits (par exemple, dans le contrôleur), rendant le code plus facile à maintenir et réduisant les risques d'erreurs.
        sequelize,
        modelName: 'ScheduleTourney',
        hooks: {
            beforeCreate: (schedule) => {
                validateTimes(schedule);
            },
            beforeUpdate: (schedule) => {
                validateTimes(schedule);
            }
        },
    });

    // Fonction de validation des horaires
    function validateTimes(schedule) {
        const { startTime, endTime, introductionStartTime, introductionEndTime, lunchStartTime, lunchEndTime, outroStartTime, outroEndTime } = schedule;

        // Validation de l'heure de début et de fin du planning global
        if (startTime >= endTime) {
            throw new Error("L'heure de fin du planning global doit être supérieure à l'heure de début.");
        }

        // Tableau pour valider chaque paire (début, fin) par rapport au planning global
        const timePairs = [
            { start: introductionStartTime, end: introductionEndTime, label: "Introduction" },
            { start: lunchStartTime, end: lunchEndTime, label: "Déjeuner" },
            { start: outroStartTime, end: outroEndTime, label: "Conclusion" },
        ];

        for (let pair of timePairs) {
            if (pair.start && pair.end) {
                if (pair.start >= pair.end) {
                    throw new Error(`L'heure de début doit être inférieure à l'heure de fin pour la section ${pair.label}.`);
                }
                if (pair.start < startTime || pair.end > endTime) {
                    throw new Error(`Les heures de début et de fin pour la section ${pair.label} doivent être comprises entre le début (${startTime}) et la fin (${endTime}) du planning global.`);
                }
            }
        }
    }

    return ScheduleTourney;
};
