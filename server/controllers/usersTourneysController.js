// server/controllers/usersTourneysController.js
const { UsersTourneys, User, Tourney, Team, Role } = require('../models');
const { Op } = require('sequelize');

// Ajouter un utilisateur à un tournoi
exports.addUserToTourney = async (req, res) => {
    const { userId } = req.body;
    const { tourneyId } = req.params;

    try {
        const userTourney = await UsersTourneys.create({ userId, tourneyId });
        res.status(201).json(userTourney);
    } catch (error) {
        console.error('Erreur lors de l’ajout de l’utilisateur au tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les utilisateurs d'un tournoi (hors admin)
exports.getUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'roleId', 'teamId', 'Team'],
            include: [
                {
                    model: Tourney,
                    as: 'tourneys',
                    where: { id: tourneyId },
                    attributes: []
                },
                {
                    model: Role,
                    where: { name: { [Op.ne]: 'admin' } },
                    attributes: []
                },
                {
                    model: Team,
                    attributes: ['teamName', 'type']
                },
            ],
        });
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs pour le tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer la participation d'un utilisateur à un tournoi (protection des admins)
exports.removeUserFromTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        // Récupérer l'utilisateur
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier que l'utilisateur n'est pas un Admin
        const role = await Role.findByPk(user.roleId);
        if (role.name === 'admin') {
            return res.status(403).json({ message: "Impossible de supprimer un Admin du tournoi." });
        }

        // Supprimer la participation de l'utilisateur au tournoi
        await UsersTourneys.destroy({
            where: { userId, tourneyId },
        });

        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l’utilisateur du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer les utilisateurs non assignés à une équipe pour un tournoi spécifique (Guest users)
exports.getUnassignedUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;
    try {
        const unassignedUsers = await User.findAll({
            where: {
                teamId: null,
                roleId: 4, // Assurez-vous que 4 correspond bien à 'guest'
            },
            attributes: ['id', 'name', 'roleId', 'teamId'],
            include: [
                {
                    model: Tourney,
                    as: 'tourneys',
                    where: { id: tourneyId },
                    attributes: []
                },
            ],
        });
        res.json(unassignedUsers);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs non assignés :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs non assignés.' });
    }
};

// Récupérer les informations d'un utilisateur dans un tournoi, y compris son équipe
exports.getUserInfoByTourney = async (req, res) => {
    const { tourneyId, userId } = req.params;

    try {
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'name', 'roleId', 'teamId', 'Team'],
            include: [
                {
                    model: Tourney,
                    as: 'tourneys',
                    where: { id: tourneyId },
                    attributes: []
                },
                {
                    model: Team,
                    attributes: ['teamName', 'type']
                },
                {
                    model: Role,
                    attributes: ['name']
                },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: "L'utilisateur ne participe pas à ce tournoi." });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'utilisateur dans le tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
