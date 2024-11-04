// server/controllers/userController.js
const { User, Tourney, Role, UsersTourneys, Team } = require('../models');
const { roles } = require('../config/roles');
const bcrypt = require('bcrypt');

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

// Récupérer tous les utilisateurs avec leurs tournois et équipes (admin seulement)
exports.getAllUsersWithDetails = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est admin
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

        const { tourneyId } = req.query;

        const whereCondition = {};
        if (tourneyId) {
            whereCondition['$usersTourneys.tourneyId$'] = tourneyId;
        }

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'phone'],
            include: [
                {
                    model: UsersTourneys,
                    as: 'usersTourneys',
                    where: tourneyId ? { tourneyId } : undefined,
                    include: [
                        {
                            model: Tourney,
                            as: 'tourney',
                            attributes: ['id', 'name'],
                        },
                        {
                            model: Team,
                            as: 'team',
                            attributes: ['id', 'teamName', 'type'],
                        },
                    ],
                },
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name'],
                },
            ],
        });

        res.json(users);
    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs avec détails :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.createUser = async (req, res) => {
    // Vérifier que l'utilisateur est admin
    if (req.user.roleId !== roles.ADMIN) {
        return res.status(403).json({ message: 'Accès interdit.' });
    }

    const { name, email, password, phone, roleId, tourneyIds } = req.body;

    try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer l'utilisateur
        const user = await User.create({ name, email, password: hashedPassword, phone, roleId });

        // Assigner l'utilisateur aux tournois
        if (Array.isArray(tourneyIds)) {
            const usersTourneysData = tourneyIds.map((tourneyId) => ({
                userId: user.id,
                tourneyId,
            }));
            await UsersTourneys.bulkCreate(usersTourneysData);
        }

        // Exclure le mot de passe de la réponse
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            roleId: user.roleId,
        };

        res.status(201).json(userData);
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.removeUserFromTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        // Vérifier que l'utilisateur est admin
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

        const association = await UsersTourneys.findOne({
            where: { userId, tourneyId },
        });

        if (!association) {
            return res.status(404).json({ message: 'Association non trouvée.' });
        }

        await association.destroy();

        res.status(200).json({ message: 'Utilisateur retiré du tournoi avec succès.' });
    } catch (error) {
        console.error('Erreur lors du retrait de l\'utilisateur du tournoi :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Récupérer tous les tournois auxquels un utilisateur participe
exports.getTourneysByUser = async (req, res) => {
    const { userId } = req.params;

    try {
        // Vérifier si l'utilisateur fait la requête pour lui-même ou s'il est admin
        if (req.user.id !== parseInt(userId, 10) && req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

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
        // Vérifier que l'utilisateur est admin avant de continuer
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit. Seuls les administrateurs peuvent accéder à cette ressource.' });
        }

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
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
        // Vérifier si l'utilisateur fait la requête pour lui-même ou s'il est admin
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

// Mettre à jour un utilisateur (admin ou soi-même)
exports.updateUser = async (req, res) => {
    const { userId } = req.params;
    const { name, email, phone, password } = req.body;

    try {
        // Vérification des permissions déjà gérée par authorizeUserOrAdmin

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        const updatedData = { name, email, phone };

        if (password) {
            // Si l'utilisateur est un admin, il peut changer le mot de passe sans l'ancien mot de passe
            if (req.user.roleId === roles.ADMIN) {
                // Hasher le nouveau mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);
                updatedData.password = hashedPassword;
            } else {
                // Si l'utilisateur n'est pas admin, il doit fournir l'ancien mot de passe
                const { oldPassword } = req.body;
                if (!oldPassword) {
                    return res.status(400).json({ message: 'Ancien mot de passe requis pour changer le mot de passe.' });
                }
                const isMatch = await bcrypt.compare(oldPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
                }
                // Hasher le nouveau mot de passe
                const hashedPassword = await bcrypt.hash(password, 10);
                updatedData.password = hashedPassword;
            }
        }

        // Mettre à jour les informations de l'utilisateur
        await user.update(updatedData);

        // Exclure le champ `password` dans la réponse
        const updatedUser = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'phone', 'roleId'],
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name'],
                },
            ],
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
        // Vérifier que l'utilisateur est admin avant de continuer
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
