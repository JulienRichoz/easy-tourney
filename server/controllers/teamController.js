// server/controllers/teamController.js
const { Team, Tourney } = require('../models');

// Créer une équipe
exports.createTeam = async (req, res) => {
    const { teamName, tourneyId } = req.body;

    try {
        const tourney = await Tourney.findByPk(tourneyId);

        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const team = await Team.create({ teamName, tourneyId });
        res.status(201).json(team);
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Obtenir toutes les équipes d'un tournoi
exports.getTeamsByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const teams = await Team.findAll({ where: { tourneyId } });
        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour une équipe
exports.updateTeam = async (req, res) => {
    const { id } = req.params;
    const { teamName } = req.body;

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        team.teamName = teamName;
        await team.save();

        res.status(200).json(team);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer une équipe
exports.deleteTeam = async (req, res) => {
    const { id } = req.params;

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        await team.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
