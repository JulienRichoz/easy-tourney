// server/controllers/sportsFieldsController.js
// Contrôleur pour la gestion des associations sportsFields

const { Field, Sport, SportsFields } = require('../models');

// Créer une association sportsFields
exports.createSportsFields = async (req, res) => {
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

        // Créer le sportsFields
        const sportsFields = await SportsFields.create({
            fieldId,
            sportId,
            startTime,
            endTime,
            information,
        });

        res.status(201).json(sportsFields);
    } catch (error) {
        console.error('Erreur lors de la création de l\'association sportsFields :', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'association sportsFields' });
    }
};

exports.updateSportsFields = async (req, res) => {
    try {
        const { id } = req.params;
        const { startTime, endTime, fieldId } = req.body;

        const sportsFields = await SportsFields.findByPk(id);

        if (!sportsFields) {
            return res.status(404).json({ message: "Sport associé au terrain non trouvé" });
        }

        await sportsFields.update({ startTime, endTime, fieldId });

        res.status(200).json(sportsFields);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du sport associé au terrain :", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du sport associé au terrain" });
    }
};

exports.deleteSportsFields = async (req, res) => {
    try {
        const { id } = req.params;

        // Trouver le sportsFields par son ID
        const sportsFields = await SportsFields.findByPk(id);

        if (!sportsFields) {
            return res.status(404).json({ message: "sportsFields non trouvé." });
        }

        // Supprimer l'association du sport avec le terrain
        await sportsFields.destroy();

        res.status(200).json({ message: 'sportsFields supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression du sportsFields :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du sportsFields' });
    }
};

