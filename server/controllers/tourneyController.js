// server/controllers/tourneyController.js
// Contrôleur pour la gestion des tournois

const { Tourney, Field, SportField, Sport, GroupSetup, ScheduleTourney } = require('../models');

exports.createTourney = async (req, res) => {
    try {
        const { name, location, dateTourney, numberOfField, emergencyDetails } = req.body;

        if (!name || !location || !dateTourney) {
            return res.status(400).json({ message: "Les champs 'name', 'location' et 'dateTourney' sont requis." });
        }

        // Créer le tournoi principal
        const newTourney = await Tourney.create({
            name,
            location,
            dateTourney,
            numberOfField,
            emergencyDetails
        });

        // Créer les terrains associés
        for (let i = 0; i < numberOfField; i++) {
            await Field.create({
                name: `Field ${i + 1}`,
                tourneyId: newTourney.id,
            });
        }

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


// Ajouter la configuration de groupe au tournoi
exports.createGroupSetup = async (req, res) => {
    try {
        const { tourneyId } = req.params;
        const { maxGroupNumber, playerPerGroup, playerEstimated } = req.body;

        if (!maxGroupNumber || !playerPerGroup) {
            return res.status(400).json({ message: "Les champs 'maxGroupNumber' et 'playerPerGroup' sont requis." });
        }

        const groupSetup = await GroupSetup.create({
            tourneyId,
            maxGroupNumber,
            playerPerGroup,
            playerEstimated,
        });

        res.status(201).json(groupSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de groupe :', error);
        res.status(500).json({ message: 'Erreur lors de la création de la configuration de groupe' });
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

// Récupérer un tournoi par son ID, y compris les terrains et les sports associés
exports.getTourneyById = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id, {
            include: [
                {
                    model: Field,
                    as: 'fields',
                    include: [
                        {
                            model: SportField,
                            as: 'sportFields',
                            include: [
                                {
                                    model: Sport,
                                    as: 'sport',
                                    attributes: ['id', 'name', 'rule', 'scoreSystem', 'color', 'image'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        res.status(200).json(tourney);
    } catch (error) {
        console.error('Erreur lors de la récupération du tournoi :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du tournoi' });
    }
};


// Mettre à jour un tournoi
exports.updateTourney = async (req, res) => {
    try {
        const tourney = await Tourney.findByPk(req.params.id);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        await tourney.update(req.body);

        res.status(200).json(tourney);
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

        const sportFields = await SportField.findAll({
            where: { fieldId },
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'rule', 'scoreSystem', 'color', 'image'],
                },
            ],
        });


        if (sportFields.length === 0) {
            return res.status(404).json({ message: "Aucun sport n'est associé à ce terrain." });
        }

        res.status(200).json(sportFields);
    } catch (error) {
        console.error('Erreur lors de la récupération des sports par terrain :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sports' });
    }
};
