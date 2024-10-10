const { Sport } = require('../models');

// Créer un sport
exports.createSport = async (req, res) => {
    try {
        const newSport = await Sport.create(req.body);
        res.status(201).json(newSport);
    } catch (error) {
        console.error('Erreur lors de la création du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la création du sport' });
    }
};

// Récupérer tous les sports
exports.getSports = async (req, res) => {
    try {
        const sports = await Sport.findAll();
        res.status(200).json(sports);
    } catch (error) {
        console.error('Erreur lors de la récupération des sports :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sports' });
    }
};

// Récupérer un sport par son ID
exports.getSportById = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }
        res.status(200).json(sport);
    } catch (error) {
        console.error('Erreur lors de la récupération du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du sport' });
    }
};

// Mettre à jour un sport
exports.updateSport = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        await sport.update(req.body);
        res.status(200).json(sport);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du sport' });
    }
};

// Supprimer un sport
exports.deleteSport = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        await sport.destroy();
        res.status(200).json({ message: 'Sport supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du sport' });
    }
};
