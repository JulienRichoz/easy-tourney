const { TeamSetup, Tourney } = require('../models');
const { checkAndUpdateStatuses } = require('../utils/statusUtils');

// Créer une nouvelle configuration de team
exports.createTeamSetup = async (req, res) => {
    const { maxTeamNumber, playerPerTeam, minPlayerPerTeam, minTeamPerPool, maxTeamPerPool } = req.body; 
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }
        // Verifier que le champ joueur par equipe est supérieur au nb de joueurs minimum
        if (playerPerTeam < minPlayerPerTeam) {
            return res.status(400).json({
                message: 'Le nombre de joueurs par équipe doit être supérieur ou égal au nombre minimum de joueurs par équipe.'
            });
        }

        // Vérifier que minTeamPerPool et maxTeamPerPool ne sont pas `null` avant de faire la vérification
        if (minTeamPerPool !== null && maxTeamPerPool !== null) {
            // Vérifier que le minTeamPerPool est inférieur ou égal au maxTeamPerPool
            if (minTeamPerPool > maxTeamPerPool) {
                return res.status(400).json({
                    message: 'Le nombre minimum d\'équipes par pool doit être inférieur ou égal au nombre maximum d\'équipes par pool.'
                });
            }
        }

        const teamSetup = await TeamSetup.create({
            tourneyId,
            maxTeamNumber,
            playerPerTeam,
            minPlayerPerTeam,
            minTeamPerPool,
            maxTeamPerPool
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
    const { maxTeamNumber, playerPerTeam, minPlayerPerTeam, minTeamPerPool, maxTeamPerPool } = req.body; 
    const { tourneyId } = req.params;

    try {
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }
        // Verifier que le champ joueur par equipe est supérieur au nb de joueurs minimum
        if (playerPerTeam < minPlayerPerTeam) {
            return res.status(400).json({
                message: 'Le nombre de joueurs par équipe doit être supérieur ou égal au nombre minimum de joueurs par équipe.'
            });
        }   

        // Vérifier que minTeamPerPool et maxTeamPerPool ne sont pas `null` avant de faire la vérification
        if (minTeamPerPool !== null && maxTeamPerPool !== null) {
            if (minTeamPerPool > maxTeamPerPool) {
                return res.status(400).json({
                    message: 'Le nombre minimum d\'équipes par pool doit être inférieur ou égal au nombre maximum d\'équipes par pool.'
                });
            }
        }

        // Mise à jour des champs
        teamSetup.maxTeamNumber = maxTeamNumber;
        teamSetup.playerPerTeam = playerPerTeam;
        teamSetup.minPlayerPerTeam = minPlayerPerTeam;
        teamSetup.minTeamPerPool = minTeamPerPool;
        teamSetup.maxTeamPerPool = maxTeamPerPool;

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
                minTeamPerPool: null,
                maxTeamPerPool: null,
                message: 'Aucune configuration trouvée. Veuillez configurer les équipes.'
            });
        }
        res.json(teamSetup);
    } catch (error) {
        console.error('Erreur lors de la récupération de la configuration de team:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};



