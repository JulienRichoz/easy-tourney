// server/controllers/teamController.js
const { Team, TeamSetup, Tourney, User, UsersTourneys, sequelize } = require('../models');
const { Op } = require('sequelize');
const { checkAndUpdateStatuses, getRegistrationStatus } = require('../utils/statusUtils');

/**
 * Helper function to determine role based on team type.
 * @param {string} type - Type of the team ('player', 'assistant').
 * @returns {string} - Corresponding role name.
 */
const getRoleByTeamType = (type) => {
    if (type === 'player') return 'player';
    if (type === 'assistant') return 'assistant';
    return 'guest'; // Default
};

// Créer une équipe
exports.createTeam = async (req, res) => {
    const { teamName, type } = req.body;
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        if (!['player', 'assistant'].includes(type)) {
            return res.status(400).json({ message: 'Type d\'équipe invalide. Doit être "player" ou "assistant".' });
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

// Obtenir toutes les équipes d'un tournoi avec les utilisateurs associés via UsersTourneys
exports.getTeamsByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const teams = await Team.findAll({
            where: { tourneyId },
            include: [
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'phone'],
                        }
                    ]
                }
            ],
        });

        res.status(200).json(teams);
    } catch (error) {
        console.error('Erreur lors de la récupération des équipes :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des équipes.' });
    }
};

// Récupérer les détails d'une équipe, y compris les utilisateurs associés via UsersTourneys
exports.getTeamById = async (req, res) => {
    const { teamId, tourneyId } = req.params;

    try {
        const team = await Team.findOne({
            where: { id: teamId, tourneyId },
            include: [
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'phone'],
                        }
                    ]
                }
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

// Mettre à jour une équipe et ajuster les rôles des utilisateurs associés si le type de l'équipe change
exports.updateTeam = async (req, res) => {
    const { teamId, tourneyId } = req.params;
    const { teamName, type } = req.body;

    try {
        const team = await Team.findOne({ 
            where: { id: teamId, tourneyId },
            include: [{ model: UsersTourneys, as: 'usersTourneys', include: [{ model: User, as: 'user' }] }]
        });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        if (type && !['player', 'assistant'].includes(type)) {
            return res.status(400).json({ message: 'Type d\'équipe invalide. Doit être "player" ou "assistant".' });
        }

        const oldType = team.type;
        team.teamName = teamName || team.teamName;
        team.type = type || team.type;
        await team.save();

        // Si le type de l'équipe a changé, mettre à jour tourneyRole des utilisateurs associés
        if (type && type !== oldType) {
            const newTournamentRole = getRoleByTeamType(type);
            const usersTourneys = team.usersTourneys;
            for (const userTourney of usersTourneys) {
                userTourney.tourneyRole = newTournamentRole;
                await userTourney.save();
            }
        }

        res.status(200).json(team);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'équipe.' });
    }
};

// Supprimer une équipe et réassigner ses utilisateurs à "Guest" via UsersTourneys
exports.deleteTeam = async (req, res) => {
    const { teamId, tourneyId } = req.params;

    // Démarrer une transaction pour assurer l'atomicité
    const transaction = await sequelize.transaction();

    try {
        // Trouver l'équipe à supprimer avec ses utilisateurs
        const team = await Team.findOne({
            where: { id: teamId, tourneyId },
            include: [
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: User,
                            as: 'user'
                        }
                    ]
                }
            ],
            transaction,
        });

        if (!team) {
            await transaction.rollback();
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        // Réassigner les utilisateurs de cette équipe à "Guest" et mettre à jour tourneyRole
        if (team.usersTourneys.length > 0) {
            for (const userTourney of team.usersTourneys) {
                userTourney.teamId = null;
                userTourney.tourneyRole = 'guest';
                await userTourney.save({ transaction });
            }
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

// Assigner un utilisateur à une équipe via UsersTourneys
exports.assignUserToTeam = async (req, res) => {
    const { teamId, tourneyId } = req.params;
    const { userId } = req.body;
    const isAdmin = req.user && req.user.isAdmin; // Vérifiez si l'utilisateur est admin

    try {
        // Vérifier le statut des inscriptions si l'utilisateur n'est pas admin
        if (!isAdmin) {
            const registrationStatus = await getRegistrationStatus(tourneyId);
            if (registrationStatus !== 'active') {
                return res.status(403).json({ message: 'Les inscriptions ne sont pas ouvertes.' });
            }
        }

        const team = await Team.findOne({ where: { id: teamId, tourneyId } });
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        const userTourney = await UsersTourneys.findOne({
            where: { userId, tourneyId },
            include: [{ model: User, as: 'user' }]
        });
        if (!userTourney) {
            return res.status(400).json({ message: 'L\'utilisateur ne participe pas à ce tournoi.' });
        }

        if (userTourney.teamId && userTourney.teamId !== teamId) {
            return res.status(400).json({ message: 'L\'utilisateur est déjà assigné à une autre équipe.' });
        }

        // Assigner l'utilisateur à l'équipe via UsersTourneys
        userTourney.teamId = teamId;
        userTourney.tourneyRole = getRoleByTeamType(team.type);
        await userTourney.save();

        res.status(200).json({ message: 'Utilisateur assigné à l\'équipe avec succès.', userTourney });
    } catch (error) {
        console.error('Erreur lors de l\'assignation de l\'utilisateur à l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'assignation de l\'utilisateur à l\'équipe.' });
    }
};

// Supprimer un utilisateur d'une équipe
exports.removeUserFromTeam = async (req, res) => {
    const { teamId, userId, tourneyId } = req.params;
    const isAdmin = req.user && req.user.isAdmin; // Vérifiez si l'utilisateur est admin

    try {
        // Vérifier le statut des inscriptions si l'utilisateur n'est pas admin
        if (!isAdmin) {
            const registrationStatus = await getRegistrationStatus(tourneyId);
            if (registrationStatus !== 'active') {
                return res.status(403).json({ message: 'Les inscriptions ne sont pas ouvertes.' });
            }
        }

        const userTourney = await UsersTourneys.findOne({
            where: { userId, teamId, tourneyId },
            include: [{ model: User, as: 'user' }]
        });

        if (!userTourney) {
            return res.status(404).json({ message: 'Association utilisateur-équipes introuvable.' });
        }

        // Réassigner l'utilisateur à "guest"
        userTourney.teamId = null;
        userTourney.tourneyRole = 'guest';
        await userTourney.save();

        res.status(200).json({ message: 'Utilisateur supprimé de l\'équipe avec succès.', userTourney });
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
        const createdTeams = await Team.bulkCreate(teams, { returning: true });

        res.status(201).json({ message: 'Équipes générées avec succès', teams: createdTeams });
    } catch (error) {
        console.error('Erreur lors de la génération des équipes:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Réinitialiser les équipes et réassigner les utilisateurs à "Guest" via UsersTourneys
exports.resetTeamsAndReassignUsers = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        // Supprimer toutes les équipes du tournoi
        await Team.destroy({ where: { tourneyId } });

        // Réassigner tous les utilisateurs du tournoi comme "Guest" (sauf admin)
        const usersTourneys = await UsersTourneys.findAll({ where: { tourneyId } });
        const userIds = usersTourneys.map(ut => ut.userId);

        // Sélectionner uniquement les utilisateurs qui ne sont pas des Admins
        const nonAdminUsers = await User.findAll({
            where: {
                id: { [Op.in]: userIds },
                roleId: { [Op.ne]: 1 } // Supposons que 1 = ADMIN
            }
        });

        const nonAdminUserIds = nonAdminUsers.map(user => user.id);

        // Réinitialiser les équipes à null et tourneyRole à 'guest' dans UsersTourneys
        await UsersTourneys.update(
            { teamId: null, tourneyRole: 'guest' },
            { where: { userId: { [Op.in]: nonAdminUserIds }, tourneyId } }
        );

        res.status(200).json({ message: 'Équipes supprimées et utilisateurs réassignés en tant que Guest.' });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation des équipes et des utilisateurs:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation des équipes et des utilisateurs.' });
    }
};

// Assigner plusieurs utilisateurs à des équipes via UsersTourneys
exports.autoFillTeams = async (req, res) => {
    const { tourneyId } = req.params;
    const { assignments } = req.body;

    const transaction = await sequelize.transaction();

    try {
        for (const assignment of assignments) {
            const { userId, teamId } = assignment;

            const team = await Team.findOne({ where: { id: teamId, tourneyId }, transaction });
            if (!team) {
                throw new Error(`Équipe avec ID ${teamId} non trouvée.`);
            }

            const userTourney = await UsersTourneys.findOne({
                where: { userId, tourneyId },
                transaction,
            });
            if (!userTourney) {
                throw new Error(`L'utilisateur ${userId} ne participe pas au tournoi ${tourneyId}.`);
            }

            // Assigner l'utilisateur à l'équipe via UsersTourneys et mettre à jour tourneyRole
            userTourney.teamId = teamId;
            userTourney.tourneyRole = getRoleByTeamType(team.type);
            await userTourney.save({ transaction });
        }

        await transaction.commit();
        res.status(200).json({ message: 'Affectations enregistrées avec succès.' });
    } catch (error) {
        await transaction.rollback();
        console.error('Erreur lors des affectations en lot:', error);
        res.status(500).json({ message: 'Erreur lors des affectations en lot.', error: error.message });
    }
};

// Créer une nouvelle configuration de team
exports.createTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, minPlayerPerTeam } = req.body;
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        // Vérifier que le nombre de joueurs par équipe est valide
        if (playerPerTeam < minPlayerPerTeam) {
            return res.status(400).json({
                message: 'Le nombre de joueurs par équipe doit être supérieur ou égal au nombre minimum de joueurs par équipe.',
            });
        }

        const teamSetup = await TeamSetup.create({
            tourneyId,
            maxTeamNumber,
            playerPerTeam,
            minPlayerPerTeam,
        });

        await checkAndUpdateStatuses(tourneyId);

        res.status(201).json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour une configuration de team existante
exports.updateTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, minPlayerPerTeam } = req.body;
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        // Vérifier que le nombre de joueurs par équipe est valide
        if (playerPerTeam < minPlayerPerTeam) {
            return res.status(400).json({
                message: 'Le nombre de joueurs par équipe doit être supérieur ou égal au nombre minimum de joueurs par équipe.',
            });
        }

        // Mise à jour des champs
        teamSetup.maxTeamNumber = maxTeamNumber;
        teamSetup.playerPerTeam = playerPerTeam;
        teamSetup.minPlayerPerTeam = minPlayerPerTeam;

        await teamSetup.save();

        res.json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir la configuration de team
exports.getTeamSetup = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });

        if (!teamSetup) {
            // Si aucune configuration n'est trouvée, renvoyer une structure par défaut
            return res.json({
                maxTeamNumber: null,
                playerPerTeam: null,
                minPlayerPerTeam: null,
                message: 'Aucune configuration trouvée. Veuillez configurer les équipes.',
            });
        }
        res.json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

/**
 * Récupérer les équipes non assignées à une pool pour un tournoi donné.
 */
exports.getUnassignedTeams = async (req, res) => {
    const { tourneyId } = req.params;
  
    try {
      const unassignedTeams = await Team.findAll({
        where: {
          tourneyId,
          poolId: null, // Équipes non assignées à une pool
          type: 'player', // Exclure les équipes de type 'assistant'
        },
        include: [
          {
            model: UsersTourneys,
            as: 'usersTourneys',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'phone'],
              },
            ],
          },
        ],
      });
  
      res.status(200).json(unassignedTeams);
    } catch (error) {
      console.error('Erreur lors de la récupération des équipes non assignées :', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des équipes non assignées.', error });
    }
  };

