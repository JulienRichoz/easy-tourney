// controllers/userController.js
const { User, Tourney, Role, Team } = require('../models');
const { roles } = require('../config/roles');

// Récupérer le profil de l'utilisateur authentifié
exports.getOwnProfile = async (req, res) => {
  const userId = req.user.id;
  try {
      const user = await User.findByPk(userId, {
          attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId'],
          include: [
              {
                  model: Role,
                  as: 'role',
                  attributes: ['id', 'name']
              },
              {
                  model: Team,
                  as: 'team',
                  attributes: ['id', 'name']
              }
          ]
      });
      if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
      res.json(user);
  } catch (error) {
      console.error('Erreur lors de la récupération du profil de l\'utilisateur :', error);
      res.status(500).json({ message: 'Erreur serveur' });
  }
};

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

// Récupérer tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                },
                {
                    model: Team,
                    as: 'team',
                    attributes: ['id', 'name']
                }
            ]
        });
        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer un utilisateur par ID (soi-même ou admin)
exports.getUserById = async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'roleId', 'teamId'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                },
                {
                    model: Team,
                    as: 'team',
                    attributes: ['id', 'name']
                }
            ]
        });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
        res.json(user);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Mettre à jour un utilisateur (soi-même ou admin)
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, phone, roleId, teamId } = req.body;

    try {
        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        // Seul un admin peut mettre à jour le roleId
        if (roleId && req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: "Accès interdit. Seuls les administrateurs peuvent changer le rôle." });
        }

        await user.update({ name, email, phone, roleId, teamId });

        // Exclure le champ `password` dans la réponse
        const updatedUser = await User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                },
                {
                    model: Team,
                    as: 'team',
                    attributes: ['id', 'name']
                }
            ]
        });

        res.json(updatedUser);
    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'utilisateur :", error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer un utilisateur (admin seulement)
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
