const { UsersTourneys, User, Tourney } = require('../models');

// Ajouter un utilisateur à un tournoi
exports.addUserToTourney = async (req, res) => {
    const { userId, tourneyId } = req.body;

    try {
        const userTourney = await UsersTourneys.create({ userId, tourneyId });
        res.status(201).json(userTourney);
    } catch (error) {
        console.error('Erreur lors de l’ajout de l’utilisateur au tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les tournois auxquels un utilisateur participe
exports.getTourneysByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const tourneys = await UsersTourneys.findAll({
            where: { userId },
            include: [Tourney],
        });
        res.json(tourneys);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois pour l’utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les utilisateurs d'un tournoi
exports.getUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const users = await UsersTourneys.findAll({
            where: { tourneyId },
            include: [User],
        });
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs pour le tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer la participation d'un utilisateur à un tournoi
exports.removeUserFromTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        await UsersTourneys.destroy({
            where: { userId, tourneyId },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l’utilisateur du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
