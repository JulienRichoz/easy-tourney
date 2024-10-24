const { User, Tourney } = require('../models');

// Récupérer tous les tournois auxquels un utilisateur participe
exports.getTourneysByUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Tourney,
          as: 'tourneys',
          attributes: ['id', 'name', 'location', 'dateTourney']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    res.json(user.tourneys);
  } catch (error) {
    console.error('Erreur lors de la récupération des tournois pour l’utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};
