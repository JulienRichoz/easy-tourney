// server/controllers/tourneyController.js

const { Op } = require('sequelize');
const { Tourney, SportsFields, Sport, TeamSetup, ScheduleTourney, User, Team, UsersTourneys, Role, InviteToken } = require('../models');
const { checkAndUpdateStatuses } = require('../utils/statusUtils');
const jwt = require('jsonwebtoken');

/**
 * Créer un nouveau tournoi
 */
exports.createTourney = async (req, res) => {
    try {
        const { name, location, dateTourney, emergencyDetails, status } = req.body;

        if (!name || !location || !dateTourney) {
            return res.status(400).json({ message: "Les champs 'name', 'location' et 'dateTourney' sont requis." });
        }

        // Créer le tournoi principal
        const newTourney = await Tourney.create({
            name,
            location,
            dateTourney,
            emergencyDetails,
            status
        });

        res.status(201).json(newTourney);
    } catch (error) {
        console.error('Erreur lors de la création du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la création du tournoi', error });
    }
};

/**
 * Ajouter le planning au tournoi
 */
exports.createScheduleTourney = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const { startTime, endTime, timeMatchRotation, timePoolRotation, introductionStartTime, introductionEndTime, lunchStartTime, lunchEndTime, outroStartTime, outroEndTime } = req.body;

        // Vérification de base pour s'assurer que les champs obligatoires sont présents
        if (!startTime || !endTime || !timeMatchRotation || !timePoolRotation) {
            return res.status(400).json({ message: "Les champs 'startTime', 'endTime', 'timeMatchRotation', et 'timePoolRotation' sont requis." });
        }

        // Créer le planning (les hooks du modèle vont valider les heures)
        const schedule = await ScheduleTourney.create({
            tourneyId,
            startTime,
            endTime,
            timeMatchRotation,
            timePoolRotation,
            introductionStartTime,
            introductionEndTime,
            lunchStartTime,
            lunchEndTime,
            outroStartTime,
            outroEndTime,
        });

        res.status(201).json(schedule);
    } catch (error) {
        console.error('Erreur lors de la création du planning :', error);
        res.status(500).json({ message: error.message || 'Erreur lors de la création du planning', error });
    }
};

/**
 * Ajouter la configuration de team au tournoi
 */
exports.createTeamSetup = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const { maxTeamNumber, playerPerTeam, minPlayerPerTeam } = req.body;

        if (!maxTeamNumber || !playerPerTeam || !minPlayerPerTeam) {
            return res.status(400).json({ message: "Les champs 'maxTeamNumber', 'playerPerTeam' et 'minPlayerPerTeam' sont requis." });
        }

        const teamSetup = await TeamSetup.create({
            tourneyId,
            maxTeamNumber,
            playerPerTeam,
            minPlayerPerTeam,
        });

        res.status(201).json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de team :', error);
        res.status(500).json({ message: 'Erreur lors de la création de la configuration de team', error });
    }
};

/**
 * Récupérer tous les tournois
 */
exports.getTourneys = async (req, res) => {
    try {
        const tourneys = await Tourney.findAll();
        res.status(200).json(tourneys);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tournois', error });
    }
};

/**
 * Récupérer un tournoi par son ID avec les détails des équipes et des utilisateurs
 */
exports.getTourneyById = async (req, res) => {
    try {
        const { tourneyId } = req.params;

        const tourney = await Tourney.findByPk(tourneyId, {
            include: [
                {
                    model: Team,
                    as: 'teams',
                    include: [
                        {
                            model: UsersTourneys,
                            as: 'usersTourneys',
                            include: [
                                {
                                    model: User,
                                    as: 'user',
                                    attributes: ['id', 'name', 'email', 'phone'],
                                    include: [
                                        {
                                            model: Role,
                                            as: 'role',
                                            attributes: ['id', 'name']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['id', 'name', 'email', 'phone'],
                            include: [
                                {
                                    model: Role,
                                    as: 'role',
                                    attributes: ['id', 'name']
                                }
                            ]
                        },
                        {
                            model: Team,
                            as: 'team',
                            attributes: ['id', 'teamName', 'type'],
                        }
                    ]
                }
            ]
        });

        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        res.status(200).json(tourney);
    } catch (error) {
        console.error('Erreur lors de la récupération du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tournoi', error });
    }
};

/**
 * Mettre à jour un tournoi existant
 */
exports.updateTourney = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const { status, ...otherUpdates } = req.body;

        const tourney = await Tourney.findByPk(tourneyId);

        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé.' });
        }

        // Mettre à jour les autres champs
        await tourney.update(otherUpdates);

        let statusForced = false;
        let statusMessage = '';

        // Si le statut est fourni dans la requête, gérer la transition manuellement
        if (status) {
            // Vérifier si la transition est draft -> ready
            if (tourney.status === 'draft' && status === 'ready') {
                // Vérifier si tous les autres statuts sont en 'completed'
                const canMoveToReady = tourney.fieldAssignmentStatus === 'completed' &&
                                       tourney.sportAssignmentStatus === 'completed' &&
                                       tourney.registrationStatus === 'completed' &&
                                       tourney.planningStatus === 'completed';

                if (canMoveToReady) {
                    tourney.status = 'ready';
                    statusMessage = 'Le statut du tournoi a été mis à jour automatiquement en "ready".';
                } else {
                    // Permettre à l'admin de forcer le statut
                    tourney.status = 'ready';
                    statusForced = true;
                    statusMessage = 'Le statut du tournoi a été forcé en "ready" malgré des statuts incomplets.';
                }
                await tourney.save();
            } else {
                // Pour les autres transitions, utiliser la fonction utilitaire
                tourney.status = status;
                await tourney.save();
                statusMessage = `Le statut du tournoi a été mis à jour en "${status}".`;
            }
        }

        // Mettre à jour les statuts après la mise à jour du tournoi
        await checkAndUpdateStatuses(tourney.id);

        res.status(200).json({
            tourney,
            statusForced,
            statusMessage
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du tournoi', error });
    }
};

/**
 * Supprimer un tournoi et réinitialiser les associations utilisateurs-équipes
 */
exports.deleteTourney = async (req, res) => {
    try {
        const { tourneyId } = req.params;

        // Démarrer une transaction pour assurer l'atomicité
        const transaction = await Tourney.sequelize.transaction();

        try {
            const tourney = await Tourney.findOne({
                where: { tourneyId },
                include: [
                    {
                        model: Team,
                        as: 'teams',
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
                        ]
                    },
                    {
                        model: UsersTourneys,
                        as: 'usersTourneys',
                        include: [
                            {
                                model: User,
                                as: 'user'
                            },
                            {
                                model: Team,
                                as: 'team'
                            }
                        ]
                    }
                ],
                transaction,
            });

            if (!tourney) {
                await transaction.rollback();
                return res.status(404).json({ message: 'Tournoi non trouvé.' });
            }

            // Réinitialiser les utilisateurs assignés aux équipes
            if (tourney.teams.length > 0) {
                for (const team of tourney.teams) {
                    for (const userTourney of team.usersTourneys) {
                        userTourney.teamId = null;
                        userTourney.tourneyRole = 'guest';
                        await userTourney.save({ transaction });
                    }
                }
            }

            // Supprimer toutes les associations UsersTourneys non liées aux équipes
            await UsersTourneys.destroy({
                where: { tourneyId: tourneyId, teamId: null },
                transaction,
            });

            // Supprimer les équipes
            await Team.destroy({
                where: { tourneyId: tourneyId },
                transaction,
            });

            // Supprimer le tournoi
            await tourney.destroy({ transaction });

            // Commit de la transaction
            await transaction.commit();

            res.status(204).send();
        } catch (error) {
            // Rollback de la transaction en cas d'erreur
            await transaction.rollback();
            console.error('Erreur lors de la suppression du tournoi :', error);
            res.status(500).json({ message: 'Erreur lors de la suppression du tournoi', error });
        }
    } catch (error) {
        console.error('Erreur lors de la suppression du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du tournoi', error });
    }
};

/**
 * Récupérer les sports associés à un terrain
 */
exports.getSportsByField = async (req, res) => {
    try {
        const { fieldId } = req.params;

        const sportsFields = await SportsFields.findAll({
            where: { fieldId },
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'rule', 'scoreSystem', 'color', 'image'],
                },
            ],
        });

        if (sportsFields.length === 0) {
            return res.status(404).json({ message: "Aucun sport n'est associé à ce terrain." });
        }

        res.status(200).json(sportsFields);
    } catch (error) {
        console.error('Erreur lors de la récupération des sports par terrain :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sports', error });
    }
};

/**
 * Récupérer les détails d'un tournoi, y compris les équipes et les utilisateurs associés
 */
exports.getTourneyTeamsDetails = async (req, res) => {
  const tourneyId = req.params.tourneyId;

  try {
    // Vérifier si le tournoi existe
    const tourney = await Tourney.findByPk(tourneyId);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    // Récupérer la configuration des équipes avec TeamSetup
    const teamSetup = await TeamSetup.findOne({
      where: { tourneyId },
      attributes: ['maxTeamNumber', 'playerPerTeam', 'minPlayerPerTeam'],
    });

    // Récupérer toutes les équipes avec leurs utilisateurs via UsersTourneys, en excluant les admins
    const teams = await Team.findAll({
      where: { tourneyId },
      attributes: ['id', 'teamName', 'type'],
      include: [
        {
          model: UsersTourneys,
          as: 'usersTourneys',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email', 'phone'],
              where: {
                roleId: { [Op.ne]: 1 }, // Exclure les admins
              },
              include: [
                {
                  model: Role,
                  as: 'role',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
        },
      ],
    });

    // Récupérer les utilisateurs non assignés à une équipe, en excluant les admins
    const unassignedUsers = await UsersTourneys.findAll({
      where: {
        tourneyId,
        teamId: null,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
          where: {
            roleId: { [Op.ne]: 1 }, // Exclure les admins
          },
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    // Récupérer tous les utilisateurs inscrits au tournoi, en excluant les admins
    const allUsers = await UsersTourneys.findAll({
      where: { tourneyId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone'],
          where: {
            roleId: { [Op.ne]: 1 }, // Exclure les admins
          },
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name'],
            },
          ],
        },
        {
          model: Team,
          as: 'team',
          attributes: ['id', 'teamName', 'type'],
        },
      ],
    });

    // Mettre à jour les statuts après la récupération des détails du tournoi
    await checkAndUpdateStatuses(tourneyId);

    res.json({
      teamSetup,
      teams,
      unassignedUsers,
      allUsers,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des détails du tournoi:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

/**
 * Récupérer les statuts d'un tournoi
 */
exports.getTourneyStatuses = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const { name, status, fieldAssignmentStatus, sportAssignmentStatus, registrationStatus, planningStatus } = tourney;
        res.status(200).json({
            name: name,
            status,
            fieldAssignmentStatus,
            sportAssignmentStatus,
            registrationStatus,
            planningStatus,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statuts du tournoi:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des statuts', error });
    }
};

/**
 * Récupérer les statuts d'enregistrememnt du tournoi
 */
exports.getRegistrationStatus = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const { name, status, fieldAssignmentStatus, sportAssignmentStatus, registrationStatus, planningStatus } = tourney;
        res.status(200).json({
            name: name,
            registrationStatus,
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du statut inscription:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du statut inscription', error });
    }
};

/*
* Rejointe un tournoi via un token d'invitation
*/
exports.joinTourneyWithToken = async (req, res) => {
    const { token } = req.body;

    try {
        // Vérifie et décode le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { tourneyId, type } = decoded;

        // Vérifie si le token est bien un token d'invitation
        if (type !== 'invite') {
            return res.status(400).json({ message: "Le token n'est pas valide pour une invitation." });
        }

        // Vérifie si le token est valide et non expiré dans la base de données
        const inviteToken = await InviteToken.findOne({
            where: { token, tourneyId, isValid: true }
        });

        if (!inviteToken) {
            return res.status(400).json({ message: 'Token invalide ou expiré.' });
        }

        // Vérifie que le token n'est pas expiré
        if (new Date() > inviteToken.expiresAt) {
            return res.status(400).json({ message: 'Le token a expiré.' });
        }

        // Vérifie l'état des inscriptions du tournoi
        const tourney = await Tourney.findByPk(tourneyId);
        // Vérifier que le tournoi existe
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé.' });
        }
        if (tourney.registrationStatus !== 'active') {
            return res.status(400).json({ message: "Les inscriptions pour ce tournoi ne sont pas ouvertes." });
        }

        // Utiliser l'userId actuel de la session pour inscrire l'utilisateur au tournoi
        const userId = req.user.id;

        // Vérifie si l'utilisateur est déjà inscrit au tournoi
        const existingUserTourney = await UsersTourneys.findOne({
            where: { userId, tourneyId }
        });

        if (existingUserTourney) {
            return res.status(400).json({ message: "Vous êtes déjà inscrit à ce tournoi." });
        }

        // Crée une nouvelle inscription au tournoi avec le rôle de "Guest"
        const userTourney = await UsersTourneys.create({
            userId,
            tourneyId,
            teamId: null,
            tourneyRole: 'guest'
        });

        res.status(201).json({ message: 'Inscription réussie au tournoi.', userTourney });
    } catch (error) {
        console.error('Erreur lors de la vérification du token d\'invitation:', error);
        res.status(400).json({ message: 'Token invalide ou expiré.' });
    }
};


