const { UsersTourneys, User, Tourney } = require('../models');

// Ajouter un utilisateur à un tournoi
exports.addUserToTourney = async (req, res) => {
    const { userId, tourneyId } = req.body;

    try {
        const userTourney = await UsersTourneys.create({ userId, tourneyId });
        res.status(201).json(userTourney);
    } catch (error) {
        console.error('Erreur lors de l’ajout de l’utilisateur au tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les tournois auxquels un utilisateur participe
exports.getTourneysByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        const tourneys = await UsersTourneys.findAll({
            where: { userId },
            include: [Tourney],
        });
        res.json(tourneys);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois pour l’utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les utilisateurs d'un tournoi
exports.getUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;

    try {
        const users = await UsersTourneys.findAll({
            where: { tourneyId },
            include: [User],
        });
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs pour le tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Supprimer la participation d'un utilisateur à un tournoi
exports.removeUserFromTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        await UsersTourneys.destroy({
            where: { userId, tourneyId },
        });
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l’utilisateur du tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

exports.getUnassignedUsersByTourney = async (req, res) => {
    const { tourneyId } = req.params;
    try {
      const unassignedUsers = await User.findAll({
        where: {
          teamId: null,
          roleId: 4,
          '$Tourneys.id$': tourneyId,
        },
        include: [
          {
            model: Tourney,
            as: 'tourneys',
            where: { id: tourneyId },
          },
        ],
      });
      res.json(unassignedUsers);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des utilisateurs non assignés.' });
    }
  };

  // Récupérer les informations d'un utilisateur dans un tournoi
exports.getUserInfoByTourney = async (req, res) => {
    const { tourneyId, idUser } = req.params;

    try {
        // Vérifier que l'utilisateur participe bien au tournoi via UsersTourneys
        const userInTourney = await UsersTourneys.findOne({
            where: { userId: idUser, tourneyId },
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'email'], // Informations générales de l'utilisateur
                },
                {
                    model: Team,
                    attributes: ['teamName', 'type'], // Informations sur l'équipe (si applicable)
                }
            ]
        });

        if (!userInTourney) {
            return res.status(404).json({ message: "L'utilisateur ne participe pas à ce tournoi." });
        }

        // Renvoyer les informations de l'utilisateur, y compris son rôle et son équipe
        res.status(200).json(userInTourney);
    } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'utilisateur dans le tournoi:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};
  
