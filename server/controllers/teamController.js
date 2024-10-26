// server/controllers/teamController.js
const { Team, TeamSetup, Tourney, User, UsersTourneys, Role, sequelize } = require('../models'); // Importation complète
const { Op } = require('sequelize');
const { checkAndUpdateStatuses } = require('../utils/statusUtils'); // Importer l'utilitaire


// Créer une équipe
exports.createTeam = async (req, res) => {
    const { teamName, type } = req.body;
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        if (!['player', 'assistant', 'guest'].includes(type)) {
            return res.status(400).json({ message: 'Type d\'équipe invalide.' });
        }

        const team = await Team.create({
            teamName,
            type,
            tourneyId,
        });

        res.status(201).json(team);
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'équipe.' });
    }
};

// Obtenir toutes les équipes d'un tournoi
exports.getTeamsByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const teams = await Team.findAll({
            where: { tourneyId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'roleId', 'teamId'],
                },
            ],
        });
        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des équipes.' });
    }
};

// Récupérer les détails d'une équipe, y compris les utilisateurs associés
exports.getTeamById = async (req, res) => {
    const { id, tourneyId } = req.params;

    try {
        const team = await Team.findOne({
            where: { id, tourneyId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email'],
                    include: [
                        {
                            model: Role,
                            attributes: ['name'],
                        },
                    ],
                },
            ],
        });

        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        res.status(200).json(team);
    } catch (error) {
        console.error('Erreur lors de la récupération des détails de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des détails de l\'équipe.' });
    }
};

// Mettre à jour une équipe
exports.updateTeam = async (req, res) => {
    const { id, tourneyId } = req.params;
    const { teamName, type } = req.body;

    try {
        const team = await Team.findOne({ where: { id, tourneyId } });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        if (type && !['player', 'assistant', 'guest'].includes(type)) {
            return res.status(400).json({ message: 'Type d\'équipe invalide.' });
        }

        team.teamName = teamName || team.teamName;
        team.type = type || team.type;
        await team.save();

        res.status(200).json(team);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'équipe.' });
    }
};

// Supprimer une équipe et réassigner ses utilisateurs
exports.deleteTeam = async (req, res) => {
    const { id, tourneyId } = req.params; //

    // Démarrer une transaction pour assurer l'atomicité
    const transaction = await sequelize.transaction();

    try {
        // Trouver l'équipe à supprimer
        const team = await Team.findOne({
            where: { id, tourneyId },
            transaction,
        });

        if (!team) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        // Trouver tous les utilisateurs assignés à cette équipe
        const users = await User.findAll({
            where: { teamId: id },
            transaction,
        });

        if (users.length > 0) {
            // Réassigner les utilisateurs : teamId à null et roleId à 4 (Guest)
            await User.update(
                { teamId: null, roleId: 4 },
                {
                    where: { teamId: id },
                    transaction,
                }
            );
        }

        // Supprimer l'équipe
        await team.destroy({ transaction });

        // Commit de la transaction
        await transaction.commit();

        // Envoyer une réponse 204 No Content
        res.status(204).send();
    } catch (error) {
        // Rollback de la transaction en cas d'erreur
        await transaction.rollback();
        console.error('Erreur lors de la suppression de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'équipe.' });
    }
};

// Assigner un utilisateur à une équipe
exports.assignUserToTeam = async (req, res) => {
    const { id, tourneyId } = req.params;
    const { userId } = req.body;

    try {
        const team = await Team.findOne({ where: { id, tourneyId } });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const userTourney = await UsersTourneys.findOne({
            where: { userId, tourneyId },
        });
        if (!userTourney) {
            return res.status(400).json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
        }

        if (user.teamId && user.teamId !== id) {
            return res.status(400).json({ message: 'L\'utilisateur est déjà assigné à une autre équipe.' });
        }

        user.teamId = id;
        await user.save();

        res.status(200).json({ message: 'Utilisateur assigné à l\'équipe avec succès.'});
    } catch (error) {
        console.error('Erreur lors de l\'assignation de l\'utilisateur à l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'assignation de l\'utilisateur à l\'équipe.' });
    }
};

// Supprimer un utilisateur d'une équipe
exports.removeUserFromTeam = async (req, res) => {
    const { id, userId, tourneyId } = req.params;

    try {
        const team = await Team.findOne({ where: { id, tourneyId } });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        const teamId = parseInt(id, 10);
        if (user.teamId !== teamId) {
            return res.status(400).json({ message: 'L\'utilisateur n\'est pas assigné à cette équipe.' });
        }

        user.teamId = null;

        const guestRole = await Role.findOne({ where: { name: 'guest' } });
        if (guestRole) {
            user.roleId = guestRole.id;
        }

        await user.save();

        res.status(200).json({ message: 'Utilisateur retiré de l\'équipe avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur de l\'équipe.' });
    }
};

// Générer des équipes pour un tournoi
exports.generateTeams = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        // Récupérer les équipes existantes pour le tournoi
        const existingTeams = await Team.findAll({ where: { tourneyId } });

        // Récupérer la configuration des équipes pour le tournoi
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });

        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        // Nombre maximal d'équipes de joueurs
        const playerTeamCount = teamSetup.maxTeamNumber;

        // Vérifier si le nombre maximal d'équipes a déjà été atteint (+1 pour l'équipe d'assistants)
        if (existingTeams.length >= playerTeamCount + 1) {
            return res.status(400).json({ message: 'Le nombre maximal d\'équipes a déjà été atteint.' });
        }

        // Vérifier si une équipe d'assistant existe déjà
        const assistantTeamExists = existingTeams.some(team => team.type === 'assistant');

        // Compter le nombre actuel d'équipes de joueurs
        const currentPlayerTeams = existingTeams.filter(team => team.type === 'player').length;

        // Calculer le nombre d'équipes de joueurs à générer
        const teamsToGenerate = playerTeamCount - currentPlayerTeams;

        // Si toutes les équipes de joueurs sont déjà générées
        if (teamsToGenerate <= 0) {
            return res.status(400).json({ message: 'Toutes les équipes de joueurs sont déjà générées.' });
        }

        const teams = [];

        // Si aucune équipe d'assistant n'existe, la créer
        if (!assistantTeamExists) {
            teams.push({
                teamName: 'Assistants',
                tourneyId: teamSetup.tourneyId,
                type: 'assistant',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Créer les équipes de joueurs manquantes
        for (let i = 0; i < teamsToGenerate; i++) {
            teams.push({
                teamName: `Team ${currentPlayerTeams + i + 1}`,
                tourneyId: teamSetup.tourneyId,
                type: 'player',
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Insérer les nouvelles équipes dans la base de données
        await Team.bulkCreate(teams);

        res.status(201).json({ message: 'Équipes générées avec succès', teams });
    } catch (error) {
        console.error('Erreur lors de la génération des équipes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Réinitialiser les équipes et réassigner les utilisateurs (protection des admins)
exports.resetTeamsAndReassignUsers = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        // Supprimer toutes les équipes du tournoi
        await Team.destroy({ where: { tourneyId } });

        // Réassigner tous les utilisateurs du tournoi comme "Guest" (sauf admin)
        const users = await UsersTourneys.findAll({ where: { tourneyId } });
        const userIds = users.map(userTourney => userTourney.userId);
        
        // Sélectionner uniquement les utilisateurs qui ne sont pas des Admins
        const nonAdminUsers = await User.findAll({
            where: {
                id: { [Op.in]: userIds },
                roleId: { [Op.ne]: 1 } // Exclure les admins (roleId 1)
            }
        });

        const nonAdminUserIds = nonAdminUsers.map(user => user.id);

        // Réinitialiser les équipes et les rôles à "Guest" pour tous les non-admins
        await User.update(
            { teamId: null, roleId: 4 }, // Réinitialiser les équipes et les rôles à "Guest"
            { where: { id: { [Op.in]: nonAdminUserIds } } }
        );

        res.status(200).json({ message: 'Équipes supprimées et utilisateurs réassignés en tant que Guest.' });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des équipes et des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation des équipes et des utilisateurs.' });
    }
};
