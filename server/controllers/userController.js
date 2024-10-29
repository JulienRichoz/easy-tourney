const { User, Tourney, Role } = require('../models');

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

// Récupérer tous les utilisateurs
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId']
    });
    res.json(users);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Récupérer un utilisateur par ID
exports.getUserById = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId']
    });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// controllers/userController.js
exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, roleId, teamId } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

    await user.update({ name, email, phone, roleId, teamId });

    // Exclure le champ `password` dans la réponse
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur :', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};