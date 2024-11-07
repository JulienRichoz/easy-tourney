// server/controllers/fieldController.js
const { Field, Tourney } = require('../models');
const { checkAndUpdateStatuses } = require('../utils/statusUtils'); // Importer l'utilitaire

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

        // Mettre à jour les statuts après la création d'un terrain
        await checkAndUpdateStatuses(tourneyId);

        res.status(201).json(field);
    } catch (error) {
        console.error('Erreur lors de la création du terrain:', error);
        res.status(500).json({ error: 'Erreur lors de la création du terrain' });
    }
};

// Créer plusieurs terrains pour un tournoi
exports.createMultipleFields = async (req, res) => {
    const { tourneyId } = req.params;
    const { numberOfFields } = req.body; // Récupérer le nombre de terrains à créer

    if (!numberOfFields || numberOfFields < 1) {
        return res.status(400).json({ error: 'Veuillez fournir un nombre valide de terrains à créer.' });
    }

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ error: 'Tournoi introuvable' });
        }

        // Créer un tableau de terrains à insérer en une seule requête
        const fields = [];
        for (let i = 1; i <= numberOfFields; i++) {
            fields.push({ name: `Terrain ${i}`, description: '', tourneyId });
        }

        // Insérer les terrains en une seule requête
        const createdFields = await Field.bulkCreate(fields);

        // Mettre à jour les statuts après la création des terrains
        await checkAndUpdateStatuses(tourneyId);

        res.status(201).json({ message: `${numberOfFields} terrains créés avec succès`, fields: createdFields });
    } catch (error) {
        console.error('Erreur lors de la création des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la création des terrains' });
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
    const { fieldId } = req.params;

    try {
        const field = await Field.findByPk(fieldId, {
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
    const { fieldId } = req.params;
    const { name, description } = req.body;

    try {
        const field = await Field.findByPk(fieldId);
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
    const { fieldId, tourneyId } = req.params;

    try {
        const field = await Field.findByPk(fieldId);
        if (!field) {
            return res.status(404).json({ error: 'Terrain introuvable' });
        }

        await field.destroy();

        // Mettre à jour les statuts après la suppression d'un terrain
        await checkAndUpdateStatuses(tourneyId);

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
        // Mettre à jour les statuts après la suppression d'un terrain
        await checkAndUpdateStatuses(tourneyId);
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression des terrains:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression des terrains' });
    }
};
