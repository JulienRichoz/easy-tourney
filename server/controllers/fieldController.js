//server/controllers/fieldController.js
// Purpose: Define the functions for managing fields

const { Field, Tourney } = require('../models');

// Créer un terrain
exports.createField = async (req, res) => {
    const { name, description, tourneyId } = req.body;

    try {
        // Vérifier que le tournoi existe
        const tourney = await Tourney.findByPk(tourneyId);

        if (!tourney) {
            return res.status(404).json({ error: 'Tournoi introuvable' });
        }

        // Créer le terrain et l'associer au tournoi
        const field = await Field.create({
            name,
            description,
            tourneyId
        });

        res.status(201).json(field);
    } catch (error) {
        console.error('Erreur lors de la création du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la création du terrain' });
    }
};

// Récupérer tous les terrains
exports.getFields = async (req, res) => {
    try {
        const fields = await Field.findAll({
            include: [{ model: Tourney, as: 'tourney' }],
        });
        res.status(200).json(fields);
    } catch (error) {
        console.error('Erreur lors de la récupération des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des terrains' });
    }
};

exports.getFieldById = async (req, res) => {
    const { id } = req.params;

    try {
        const field = await Field.findByPk(id, {
            include: [{ model: Tourney, as: 'tourney' }],
        });

        // Si le terrain n'existe pas
        if (!field) {
            return res.status(404).json({ error: 'Terrain introuvable' });
        }

        // Si le terrain existe mais n'est pas encore associé à un tournoi
        if (!field.tourney) {
            return res.status(200).json({ message: 'Ce terrain n\'est pas encore associé à un tournoi.' });
        }

        // Si tout est bon
        res.status(200).json(field);
    } catch (error) {
        console.error('Erreur lors de la récupération du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du terrain' });
    }
};


// Récupérer les terrains d'un tournoi spécifique
exports.getFieldsByTourneyId = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const fields = await Field.findAll({
            where: { tourneyId },
        });

        // Si aucun terrain n'est trouvé, retourner un tableau vide
        if (fields.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(fields);
    } catch (error) {
        console.error('Erreur lors de la récupération des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des terrains' });
    }
};

// Mettre à jour un terrain
exports.updateField = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        const field = await Field.findByPk(id);

        if (!field) {
            return res.status(404).json({ error: 'Terrain introuvable' });
        }

        // Mettre à jour les informations du terrain
        await field.update({
            name,
            description,
        });

        res.status(200).json(field);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la mise à jour du terrain' });
    }
};

// Supprimer un terrain
exports.deleteField = async (req, res) => {
    const { id } = req.params;

    try {
        const field = await Field.findByPk(id);

        if (!field) {
            return res.status(404).json({ error: 'Terrain introuvable' });
        }

        // Supprimer le terrain
        await field.destroy();

        res.status(204).send(); // Pas de contenu à renvoyer
    } catch (error) {
        console.error('Erreur lors de la suppression du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du terrain' });
    }
};

exports.deleteAllTourneyFields = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        // Supprimer tous les terrains associés à un tournoi
        await Field.destroy({ where: { tourneyId: tourneyId } });

        res.status(204).send(); // Pas de contenu à renvoyer
    } catch (error) {
        console.error('Erreur lors de la suppression des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression des terrains' });
    }
}