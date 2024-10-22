// server/controllers/fieldController.js
const { Field, Tourney } = require('../models');

// Créer un terrain pour un tournoi
exports.createField = async (req, res) => {
    const { name, description } = req.body;
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ error: 'Tournoi introuvable' });
        }

        const field = await Field.create({ name, description, tourneyId });
        res.status(201).json(field);
    } catch (error) {
        console.error('Erreur lors de la création du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la création du terrain' });
    }
};

// Récupérer tous les terrains d'un tournoi
exports.getFieldsByTourneyId = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const fields = await Field.findAll({ where: { tourneyId } });
        res.status(200).json(fields);
    } catch (error) {
        console.error('Erreur lors de la récupération des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des terrains' });
    }
};

// Récupérer un terrain par son ID
exports.getFieldById = async (req, res) => {
    const { id } = req.params;

    try {
        const field = await Field.findByPk(id, {
            include: [{ model: Tourney, as: 'tourney' }],
        });

        if (!field) {
            return res.status(404).json({ error: 'Terrain introuvable' });
        }

        res.status(200).json(field);
    } catch (error) {
        console.error('Erreur lors de la récupération du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération du terrain' });
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

        await field.update({ name, description });
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

        await field.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression du terrain' });
    }
};

// Supprimer tous les terrains d'un tournoi
exports.deleteAllTourneyFields = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        await Field.destroy({ where: { tourneyId } });
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression des terrains' });
    }
};
