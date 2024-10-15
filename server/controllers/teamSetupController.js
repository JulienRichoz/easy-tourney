// server/controllers/teamSetupController.js
const { TeamSetup, Tourney } = require('../models');

// Créer une nouvelle configuration de team
exports.createTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, playerEstimated } = req.body;
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
            playerEstimated
        });

        res.status(201).json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la création de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Mettre à jour une configuration de team existante
exports.updateTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, playerEstimated } = req.body;
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        teamSetup.maxTeamNumber = maxTeamNumber;
        teamSetup.playerPerTeam = playerPerTeam;
        teamSetup.playerEstimated = playerEstimated;

        await teamSetup.save();

        res.json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Obtenir la configuration du team
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

// Générer des teams
exports.generateTeams = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        const teams = [];
        for (let i = 0; i < teamSetup.maxTeamNumber; i++) {
            teams.push({
                teamName: `Team ${i + 1}`,
                tourneyId: teamSetup.tourneyId
            });
        }

        // Ajout des teams à la base de données
        await Team.bulkCreate(teams);

        res.status(201).json({ message: 'Teames générés avec succès' });
    } catch (error) {
        console.error('Erreur lors de la génération des teams:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
