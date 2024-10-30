// server/controllers/tourneyController.js
// Contrôleur pour la gestion des tournois
const { Op } = require('sequelize');
const { Tourney, SportsFields, Sport, TeamSetup, ScheduleTourney, User, Team, Role } = require('../models');
const { checkAndUpdateStatuses } = require('../utils/statusUtils');


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
        res.status(500).json({ message: 'Erreur lors de la création du tournoi' });
    }
};

// Ajouter le planning au tournoi
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
        res.status(500).json({ message: error.message || 'Erreur lors de la création du planning' });
    }
};


// Ajouter la configuration de team au tournoi
exports.createTeamSetup = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const { maxTeamNumber, playerPerTeam } = req.body;

        if (!maxTeamNumber || !playerPerTeam) {
            return res.status(400).json({ message: "Les champs 'maxTeamNumber' et 'playerPerTeam' sont requis." });
        }

        const teamSetup = await TeamSetup.create({
            tourneyId,
            maxTeamNumber,
            playerPerTeam,
        });

        res.status(201).json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de team :', error);
        res.status(500).json({ message: 'Erreur lors de la création de la configuration de team' });
    }
};

// Récupérer tous les tournois
exports.getTourneys = async (req, res) => {
    try {
        const tourneys = await Tourney.findAll();
        res.status(200).json(tourneys);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des tournois' });
    }
};

// Récupérer un tournoi par son ID
exports.getTourneyById = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        res.status(200).json(tourney);
    } catch (error) {
        console.error('Erreur lors de la récupération du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tournoi' });
    }
}

exports.updateTourney = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const { status, ...otherUpdates } = req.body;

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
        if (!status) { // Appeler checkAndUpdateStatuses uniquement si le statut n'a pas été fourni manuellement
            await checkAndUpdateStatuses(tourney.id);
        } else {
            // Si le statut a été mis à jour manuellement, il peut être nécessaire de réévaluer les statuts des composants
            await checkAndUpdateStatuses(tourney.id);
        }

        res.status(200).json({
            tourney,
            statusForced,
            statusMessage
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du tournoi' });
    }
};

// Supprimer un tournoi
exports.deleteTourney = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        await tourney.destroy();
        res.status(200).json({ message: 'Tournoi supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du tournoi' });
    }
};

// Récupérer les sports associés à un terrain
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
        res.status(500).json({ message: 'Erreur lors de la récupération des sports' });
    }
};

exports.getTourneyTeamsDetails = async (req, res) => {
    const tourneyId = req.params.id; // Correctement assigné

    try {
        console.log('tourneyId:', tourneyId); // Log pour débogage

        // Vérifier si le tournoi existe
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        // Récupérer la configuration des équipes avec TeamSetup
        const teamSetup = await TeamSetup.findOne({
            where: { tourneyId },
            attributes: ['maxTeamNumber', 'playerPerTeam', 'minPlayerPerTeam']
        });

        // Récupérer toutes les équipes avec leurs utilisateurs
        const teams = await Team.findAll({
            where: { tourneyId },
            include: [
                {
                    model: User,
                    as: 'Users', // Assurez-vous que l'alias est correct
                    attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId'],
                    include: [
                        {
                            model: Role,
                            as: 'role', // Assurez-vous que l'alias correspond
                            attributes: ['name'],
                            where: { name: { [Op.ne]: 'admin' } } // Exclure les admins
                        }
                    ]
                }
            ],
            attributes: ['id', 'teamName', 'type']
        });

        // Récupérer les utilisateurs non assignés via l'association N-N
        const unassignedUsers = await User.findAll({
            include: [{
                model: Tourney,
                as: 'tourneys',
                where: { id: tourneyId },
                attributes: []
            }],
            where: {
                teamId: null,
                roleId: 4 // 'guest'
            },
            attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId']
        });

        // Récupérer tous les utilisateurs inscrits (hors admin) via l'association N-N
        const allUsers = await User.findAll({
            include: [{
                model: Tourney,
                as: 'tourneys',
                where: { id: tourneyId },
                attributes: []
            }],
            where: {
                roleId: { [Op.ne]: 1 } // 'admin'
            },
            attributes: ['id', 'name', 'roleId', 'teamId']
        });

        await checkAndUpdateStatuses(tourneyId);
        res.json({
            teamSetup,
            teams,
            unassignedUsers,
            allUsers
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des détails du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

exports.getTourneyStatuses = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id);
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
        res.status(500).json({ message: 'Erreur lors de la récupération des statuts' });
    }
};