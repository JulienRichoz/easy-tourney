const { TeamSetup, Tourney } = require('../models');

// Créer une nouvelle configuration de team
exports.createTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, playerEstimated, minPlayerPerTeam } = req.body; // Ajout de minPlayerPerTeam
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const teamSetup = await TeamSetup.create({
            tourneyId,
            maxTeamNumber,
            playerPerTeam,
            playerEstimated,
            minPlayerPerTeam, // Inclure minPlayerPerTeam dans la création
        });

        res.status(201).json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour une configuration de team existante
exports.updateTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, playerEstimated, minPlayerPerTeam } = req.body; // Ajout de minPlayerPerTeam
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        // Mise à jour des champs
        teamSetup.maxTeamNumber = maxTeamNumber;
        teamSetup.playerPerTeam = playerPerTeam;
        teamSetup.playerEstimated = playerEstimated;
        teamSetup.minPlayerPerTeam = minPlayerPerTeam; // Mise à jour du minPlayerPerTeam

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
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        res.json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};


