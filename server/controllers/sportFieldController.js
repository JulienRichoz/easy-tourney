// server/controllers/sportFieldController.js
// Contrôleur pour la gestion des associations SportField

const { Field, Sport, SportField } = require('../models');

// Créer une association SportField
exports.createSportField = async (req, res) => {
    try {
        const { fieldId, sportId, startTime, endTime, information } = req.body;

        if (!fieldId || !sportId || !startTime || !endTime) {
            return res.status(400).json({ message: "Les champs 'fieldId', 'sportId', 'startTime' et 'endTime' sont requis." });
        }

        // Vérifier si le terrain et le sport existent
        const field = await Field.findByPk(fieldId);
        const sport = await Sport.findByPk(sportId);

        if (!field) {
            return res.status(404).json({ message: 'Terrain non trouvé' });
        }

        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        // Créer le SportField
        const sportField = await SportField.create({
            fieldId,
            sportId,
            startTime,
            endTime,
            information,
        });

        res.status(201).json(sportField);
    } catch (error) {
        console.error('Erreur lors de la création de l\'association SportField :', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'association SportField' });
    }
};

exports.updateSportField = async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, fieldId } = req.body;

        const sportField = await SportField.findByPk(id);

        if (!sportField) {
            return res.status(404).json({ message: "Sport associé au terrain non trouvé" });
        }

        await sportField.update({ startTime, endTime, fieldId });

        res.status(200).json(sportField);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du sport associé au terrain :", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du sport associé au terrain" });
    }
};
