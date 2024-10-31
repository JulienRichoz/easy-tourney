// server/controllers/userController.js
const { User, Tourney, Role, UsersTourneys, Team } = require('../models');
const { roles } = require('../config/roles');

// Récupérer le profil de l'utilisateur authentifié
exports.getOwnProfile = async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                },
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: Tourney,
                            as: 'tourney',
                            attributes: ['id', 'name']
                        },
                        {
                            model: Team,
                            as: 'team',
                            attributes: ['id', 'teamName', 'type']
                        }
                    ]
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
        const userTourneys = await UsersTourneys.findAll({
            where: { userId },
            include: [
                {
                    model: Tourney,
                    as: 'tourney',
                    attributes: ['id', 'name', 'location', 'dateTourney']
                }
            ]
        });

        if (!userTourneys.length) {
            return res.status(404).json({ message: "Aucun tournoi trouvé pour cet utilisateur." });
        }

        const tourneys = userTourneys.map(ut => ut.tourney);
        res.json(tourneys);
    } catch (error) {
        console.error('Erreur lors de la récupération des tournois pour l’utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Récupérer tous les utilisateurs (admin seulement)
exports.getAllUsers = async (req, res) => {
    try {
        // Vérifiez que l'utilisateur est admin avant de continuer
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit. Seuls les administrateurs peuvent accéder à cette ressource.' });
        }

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
            include: [
                {
                    model: Role,
                    as: 'role',
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
        // Vérifiez si l'utilisateur fait la requête pour lui-même ou s'il est admin
        if (req.user.id !== parseInt(userId, 10) && req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name']
                },
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    include: [
                        {
                            model: Tourney,
                            as: 'tourney',
                            attributes: ['id', 'name']
                        },
                        {
                            model: Team,
                            as: 'team',
                            attributes: ['id', 'teamName', 'type']
                        }
                    ]
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
    const { name, email, phone } = req.body;

    try {
        // Vérifiez si l'utilisateur fait la requête pour lui-même ou s'il est admin
        if (req.user.id !== parseInt(userId, 10) && req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit. Vous ne pouvez pas modifier cet utilisateur.' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        // Mettre à jour les informations de l'utilisateur
        await user.update({ name, email, phone });

        // Exclure le champ `password` dans la réponse
        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
            include: [
                {
                    model: Role,
                    as: 'role',
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
        // Vérifiez que l'utilisateur est admin avant de continuer
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit. Seuls les administrateurs peuvent supprimer des utilisateurs.' });
        }

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });
        await user.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
};
