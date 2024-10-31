// server/controllers/usersTourneysController.js
const { UsersTourneys, User, Tourney, Team, Role } = require('../models');
const { Op } = require('sequelize');
const { roles } = require('../config/roles'); // Importer les rôles

/**
 * Helper function to determine roleId based on team type.
 * @param {string} type - Type of the team ('player', 'assistant', or other).
 * @returns {number} - Corresponding roleId.
 */
const getRoleIdByTeamType = (type) => {
    if (type === 'player') return roles.PLAYER;
    if (type === 'assistant') return roles.ASSISTANT;
    return roles.GUEST; // Default
};

// Ajouter un utilisateur à un tournoi
exports.addUserToTourney = async (req, res) => {
    const { userId } = req.body;
    const { tourneyId } = req.params;

    try {
        // Vérifier si l'utilisateur est déjà dans le tournoi
        const existingUserTourney = await UsersTourneys.findOne({
            where: { userId, tourneyId }
        });

        if (existingUserTourney) {
            return res.status(400).json({ message: "L'utilisateur participe déjà à ce tournoi." });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Si l'utilisateur n'est pas encore inscrit, l'ajouter
        const userTourney = await UsersTourneys.create({ userId, tourneyId });

        // Optionnel : Initialiser le roleId à GUEST et teamId à null
        user.roleId = roles.GUEST;
        user.teamId = null;
        await user.save();

        res.status(201).json(userTourney);
    } catch (error) {
        console.error('Erreur lors de l’ajout de l’utilisateur au tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Assigner ou réassigner une équipe à un utilisateur via `userId` (admin requis)
exports.assignTeamToUser = async (req, res) => {
    const { tourneyId, userId } = req.params;
    const { teamId } = req.body;

    try {
        // Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId, {
            include: {
                model: Role,
                as: 'role',
                attributes: ['name'],
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Si l'utilisateur est un Admin, empêcher la modification
        if (user.role.name.toLowerCase() === 'admin') {
            return res.status(403).json({ message: "Impossible d'assigner un groupe à un Admin du tournoi." });
        }

        // Vérifier si l'équipe existe pour ce tournoi
        const team = await Team.findOne({ where: { id: teamId, tourneyId } });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée pour ce tournoi.' });
        }

        // Vérifier que l'utilisateur participe au tournoi
        const userTourney = await UsersTourneys.findOne({ where: { userId, tourneyId } });
        if (!userTourney) {
            return res.status(400).json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
        }

        // Mettre à jour l'assignation de l'utilisateur à l'équipe
        user.teamId = teamId;

        // Mettre à jour le roleId en fonction du type de l'équipe
        user.roleId = getRoleIdByTeamType(team.type);

        await user.save();

        res.status(200).json({ message: 'Équipe assignée à l\'utilisateur avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'assignation de l\'équipe à l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'assignation de l\'équipe à l\'utilisateur.' });
    }
};

// Récupérer tous les utilisateurs d'un tournoi (hors admin)
exports.getUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'roleId', 'teamId'],
            include: [
                {
                    model: Tourney,
                    as: 'tourneys',
                    where: { id: tourneyId },
                    attributes: []
                },
                {
                    model: Role,
                    as: 'role',
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
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer la participation d'un utilisateur à un tournoi (protection des admins)
exports.removeUserFromTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        // Récupérer l'utilisateur et son rôle en même temps
        const user = await User.findOne({
            where: { id: userId },
            include: {
                model: Role,
                as: 'role',
                attributes: ['name'],
            },
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier que l'utilisateur n'est pas un Admin
        if (user.role.name.toLowerCase() === 'admin') {
            return res.status(403).json({ message: "Impossible de supprimer un Admin du tournoi." });
        }

        // Supprimer la participation de l'utilisateur au tournoi
        await UsersTourneys.destroy({
            where: { userId, tourneyId },
        });

        // Réinitialiser les champs liés dans la table Users (par exemple, réinitialiser son équipe et son rôle)
        user.teamId = null;  // Retirer l'utilisateur de son équipe
        user.roleId = roles.GUEST; // Réassigner l'utilisateur au rôle 'guest'
        await user.save();

        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l’utilisateur du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer les utilisateurs non assignés à une équipe pour un tournoi spécifique (Guest users)
exports.getUnassignedUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;
    try {
        const unassignedUsers = await User.findAll({
            where: {
                teamId: null,
                roleId: roles.GUEST, // Utiliser la constante définie
            },
            attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId'], // Ajout de 'email' et 'phone'
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
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs non assignés.' });
    }
};

// Récupérer les informations d'un utilisateur dans un tournoi, y compris son équipe
exports.getUserInfoByTourney = async (req, res) => {
    const { tourneyId, userId } = req.params;

    try {
        const user = await User.findOne({
            where: { id: userId },
            attributes: ['id', 'name', 'roleId', 'teamId'],
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
                    as: 'role',
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
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un utilisateur d'une équipe (si nécessaire)
exports.removeUserFromTeam = async (req, res) => {
    const { tourneyId, userId } = req.params;

    try {
        const user = await User.findOne({
            where: { id: userId },
            include: [
                {
                    model: Tourney,
                    as: 'tourneys',
                    where: { id: tourneyId },
                    attributes: []
                },
                {
                    model: Role,
                    as: 'role',
                    attributes: ['name']
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        if (!user.teamId) {
            return res.status(400).json({ message: "L'utilisateur n'est pas assigné à une équipe." });
        }

        // Réinitialiser l'assignation de l'utilisateur à l'équipe et mettre à jour son rôle
        user.teamId = null;
        user.roleId = roles.GUEST;
        await user.save();

        res.status(200).json({ message: 'Utilisateur retiré de l\'équipe avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur de l\'équipe.' });
    }
};
