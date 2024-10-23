const { Team, TeamSetup, Tourney } = require('../models');

// Créer une équipe
exports.createTeam = async (req, res) => {
    const { teamName, type } = req.body; // Ajout du type de l'équipe (player, assistant, guest)
    const { tourneyId } = req.params; // Récupération du tourneyId depuis les paramètres d'URL

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé' });
        }

        const team = await Team.create({
            teamName,
            type, // Assurer que le type est bien passé
            tourneyId,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        res.status(201).json(team);
    } catch (error) {
        console.error('Erreur lors de la création de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'équipe.' });
    }
};

// Obtenir toutes les équipes d'un tournoi
exports.getTeamsByTourney = async (req, res) => {
    const { tourneyId } = req.params; // Récupération du tourneyId depuis les paramètres d'URL

    try {
        const teams = await Team.findAll({ where: { tourneyId } });
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
                    attributes: ['id', 'name', 'email'], // Informations des utilisateurs associés
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
    const { id } = req.params; // ID de l'équipe à mettre à jour
    const { teamName, type } = req.body; // Ajout du type de l'équipe à mettre à jour

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        team.teamName = teamName || team.teamName; // Mise à jour conditionnelle du nom
        team.type = type || team.type; // Mise à jour conditionnelle du type
        await team.save();

        res.status(200).json(team);
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l\'équipe.' });
    }
};

// Supprimer une équipe
exports.deleteTeam = async (req, res) => {
    const { id } = req.params; // ID de l'équipe à supprimer

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée' });
        }

        await team.destroy();
        res.status(204).send(); // Suppression réussie, renvoie de la réponse 204 (No Content)
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'équipe.' });
    }
};

// Supprimer toutes les équipes d'un tournoi
exports.deleteAllTeamsByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const deletedCount = await Team.destroy({
            where: { tourneyId },
        });

        if (deletedCount === 0) {
            return res.status(404).json({ message: 'Aucune équipe trouvée pour ce tournoi.' });
        }

        res.status(200).json({ message: `${deletedCount} équipes supprimées.` });
    } catch (error) {
        console.error('Erreur lors de la suppression des équipes :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression des équipes.' });
    }
};

// Assigner un utilisateur à une équipe
exports.assignUserToTeam = async (req, res) => {
    const { id } = req.params; // ID de l'équipe
    const { userId } = req.body; // ID de l'utilisateur à assigner

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        user.teamId = id; // Assigner l'utilisateur à l'équipe
        await user.save();

        res.status(200).json({ message: 'Utilisateur assigné à l\'équipe avec succès.' });
    } catch (error) {
        console.error('Erreur lors de l\'assignation de l\'utilisateur à l\'équipe :', error);
        res.status(500).json({ message: 'Erreur serveur lors de l\'assignation de l\'utilisateur à l\'équipe.' });
    }
};

// Supprimer un utilisateur d'une équipe
exports.removeUserFromTeam = async (req, res) => {
    const { id, userId } = req.params; // ID de l'équipe et de l'utilisateur

    try {
        const team = await Team.findByPk(id);
        if (!team) {
            return res.status(404).json({ message: 'Équipe non trouvée.' });
        }

        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        user.teamId = null; // Retirer l'utilisateur de l'équipe
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
        // Vérifier s'il existe déjà des équipes pour le tournoi
        const existingTeams = await Team.findAll({ where: { tourneyId } });
        if (existingTeams.length > 0) {
            return res.status(400).json({ message: 'Des équipes existent déjà pour ce tournoi.' });
        }

        // Récupérer la configuration d'équipe pour le tournoi
        const teamSetup = await TeamSetup.findOne({ where: { tourneyId } });
        if (!teamSetup) {
            return res.status(404).json({ message: 'Configuration de team non trouvée' });
        }

        // Génération des équipes en fonction de la configuration
        const teams = [];
        for (let i = 0; i < teamSetup.maxTeamNumber; i++) {
            teams.push({
                teamName: `Team ${i + 1}`,
                tourneyId: teamSetup.tourneyId,
            });
        }

        // Insertion des équipes dans la base de données
        await Team.bulkCreate(teams);

        res.status(201).json({ message: 'Équipes générées avec succès', teams });
    } catch (error) {
        console.error('Erreur lors de la génération des équipes:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Suppression de toutes les équipes et réassignation des utilisateurs en tant que "Guest"
exports.resetTeamsAndReassignUsers = async (req, res) => {
    const { tourneyId } = req.params;
  
    try {
      // Supprimer toutes les équipes du tournoi
      await Team.destroy({ where: { tourneyId } });
  
      // Réassigner tous les utilisateurs du tournoi comme "Guest" (sans équipe)
      await User.update(
        { teamId: null, roleId: 4 }, // Réinitialiser les équipes et les rôles à "Guest"
        { where: { tourneyId } }
      );
  
      res.status(200).json({ message: 'Équipes supprimées et utilisateurs réassignés en tant que Guest.' });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des équipes et des utilisateurs:', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

