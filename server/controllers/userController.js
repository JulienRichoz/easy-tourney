// server/controllers/userController.js
const { User, Tourney, Role, UsersTourneys, Team, sequelize } = require('../models');
const { roles } = require('../config/roles');
const authService = require('../services/authService');

// Récupérer tous les utilisateurs avec leurs tournois et équipes (admin seulement)
// DOC: PROBLEM https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem-in-orm-object-relational-mapping
// PROBLEM N+1
// TODO:AMELIORATIONS => inclure système de cache (redis?). Mettre en place système de pagniation
// AUTRE PROBLEME INTERESSASNT AVEC CONSOLE TIMER: 37ms la requete en moyenne => probleme vient de Vue ;)
// 2 secodnes ok.. mais à améliorer par la suite si critique. Problème peut prevenir sur la vue de v-select, v-for imbriqué, chargement multiple de composant custom
exports.getAllUsersWithDetails = async (req, res) => {
    try {
        if (req.user.roleId !== roles.ADMIN) {
        return res.status(403).json({ message: 'Accès interdit.' });
        }

        const { tourneyId } = req.query;
        
        // Démarrer le chronométrage
        console.time('Execution time for getAllUsersWithDetails');

        // Exécuter la requête
        const users = await User.findAll({
            include: [
            {
                model: Role,
                as: 'role',
                attributes: ['id', 'name'],
            },
            {
                model: UsersTourneys,
                as: 'usersTourneys',
                where: tourneyId ? { tourneyId } : undefined,
                required: tourneyId ? true : false,
                include: [
                {
                    model: Tourney,
                    as: 'tourney',
                    attributes: ['id', 'name'],
                },
                ],
            },
            ],
            order: [['id', 'ASC']],
        });
         // Arrêter le chronométrage
         console.timeEnd('Execution time for getAllUsersWithDetails');
  
    res.json(users);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs avec détails :', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
};



exports.getOwnData = async(req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
          attributes: ['id', 'name', 'email', 'phone', 'roleId'],
          include: [
            {
              model: Role,
              as: 'role',
              attributes: ['id', 'name']
            }
          ]
        });
        if (!user) {
          return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }
        res.json(user);
      } catch (error) {
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
      }
};

exports.createUser = async (req, res) => {
    // Vérifier que l'utilisateur est admin
    if (req.user.roleId !== roles.ADMIN) {
        return res.status(403).json({ message: 'Accès interdit.' });
    }

    const { name, email, password, phone, roleId, tourneyIds } = req.body;

    // Démarrer une transaction
    const t = await sequelize.transaction();

    try {
        // Vérifier si l'email existe déjà
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const hashedPassword = await authService.hashPassword(password);

        // Si roleId n'est pas fourni, assigner le rôle 'User' par défaut
        let assignedRoleId = roleId;
        if (!assignedRoleId) {
            const userRole = await Role.findOne({ where: { name: 'User' } });
            if (!userRole) {
                await t.rollback();
                return res.status(500).json({ message: 'Le rôle "User" n\'existe pas dans la base de données.' });
            }
            assignedRoleId = userRole.id;
        }

        // Vérifier l'existence des tournois si tourneyIds est fourni
        if (Array.isArray(tourneyIds) && tourneyIds.length > 0) {
            // Récupérer les tournois correspondants
            const existingTourneys = await Tourney.findAll({
                where: { id: tourneyIds }
            });

            if (existingTourneys.length !== tourneyIds.length) {
                await t.rollback();
                return res.status(400).json({ message: 'Un ou plusieurs tournois fournis sont invalides.' });
            }
        }

        // Créer l'utilisateur
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            roleId: assignedRoleId,
        }, { transaction: t });

        // Assigner l'utilisateur aux tournois
        if (Array.isArray(tourneyIds) && tourneyIds.length > 0) {
            const usersTourneysData = tourneyIds.map((tourneyId) => ({
                userId: user.id,
                tourneyId,
            }));
            await UsersTourneys.bulkCreate(usersTourneysData, { transaction: t });
        }

        // Valider la transaction
        await t.commit();

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
        // Annuler la transaction en cas d'erreur
        await t.rollback();
        console.error('Erreur lors de la création de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.addUserToTourney = async (req, res) => {
    const { userId, tourneyId } = req.params;

    try {
        // Vérifier que l'utilisateur est admin
        if (req.user.roleId !== roles.ADMIN) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier si le tournoi existe
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: "Tournoi non trouvé." });
        }

        // Vérifier si l'association existe déjà
        const existingAssociation = await UsersTourneys.findOne({
            where: { userId, tourneyId },
        });
        if (existingAssociation) {
            return res.status(400).json({ message: "L'utilisateur est déjà inscrit à ce tournoi." });
        }

        // Créer l'association
        await UsersTourneys.create({
            userId,
            tourneyId,
            tourneyRole: 'guest', // Vous pouvez ajuster le rôle selon vos besoins
        });

        res.status(200).json({ message: "Utilisateur ajouté au tournoi avec succès." });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'utilisateur au tournoi :', error);
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
    const { name, email, phone, password, roleId } = req.body;

    try {
        // Vérification des permissions déjà gérée par authorizeUserOrAdmin

        const user = await User.findByPk(userId, {
            include: [
                {
                    model: Role,
                    as: 'role',
                    attributes: ['id', 'name'],
                },
            ],
        });
        if (!user) return res.status(404).json({ message: "Utilisateur non trouvé." });

        let updatedData = { name, email, phone };

        // Permettre à un administrateur de modifier le rôle
        if (req.user.roleId === roles.ADMIN) {
            if (roleId) {
                updatedData.roleId = roleId;
            }
        }

        if (password) {
            // Si l'utilisateur est un admin, il peut changer le mot de passe sans l'ancien mot de passe
            if (req.user.roleId === roles.ADMIN) {
                // Hasher le nouveau mot de passe
                const hashedPassword = await authService.hashPassword(password);
                updatedData.password = hashedPassword;
            } else {
                // Si l'utilisateur n'est pas admin, il doit fournir l'ancien mot de passe
                const { oldPassword } = req.body;
                if (!oldPassword) {
                    return res.status(400).json({ message: 'Ancien mot de passe requis pour changer le mot de passe.' });
                }
                const isMatch = await authService.comparePassword(oldPassword, user.password);
                if (!isMatch) {
                    return res.status(400).json({ message: 'Ancien mot de passe incorrect.' });
                }
                // Hasher le nouveau mot de passe
                const hashedPassword = await authService.hashPassword(password);
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
        // Récupérer l'utilisateur actuel qui effectue la requête grâce au middleware authenticateToken
        const currentUser = req.user;

        // Vérifier si l'utilisateur à supprimer existe
        const userToDelete = await User.findByPk(userId);
        if (!userToDelete) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Vérifier si l'utilisateur à supprimer est un admin
        if (userToDelete.roleId === roles.ADMIN) {
            // Si l'utilisateur actuel n'est pas le super admin (id 1), interdire la suppression
            if (currentUser.id !== 1) {
                return res.status(403).json({
                    message: "Seul le super admin peut supprimer un autre administrateur.",
                });
            }
        }

        // Supprimer l'utilisateur
        await userToDelete.destroy();
        res.status(204).send();
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur :', error);
        res.status(500).json({ message: 'Erreur serveur lors de la suppression de l\'utilisateur.' });
    }
};
