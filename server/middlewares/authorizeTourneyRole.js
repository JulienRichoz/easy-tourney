// server/middlewares/authorizeTourneyRole.js

const { UsersTourneys } = require('../models');
const { roles } = require('../config/roles'); // Rôles globaux
const tourneyRoles = require('../config/tourneyRoles');

exports.authorizeTourneyRoles = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user.id;
            const tourneyId = parseInt(req.params.tourneyId, 10);

            // Si l'utilisateur est un administrateur global, il a accès à tout
            if (req.user.roleId === roles.ADMIN) {
                return next();
            }

            // Récupérer le rôle de l'utilisateur dans le tournoi
            const userTourney = await UsersTourneys.findOne({
                where: { userId, tourneyId },
            });

            if (!userTourney) {
                return res.status(403).json({ message: 'Accès interdit au tournoi.' });
            }

            const userTourneyRole = userTourney.tourneyRole;

            if (!allowedRoles.includes(userTourneyRole)) {
                return res.status(403).json({ message: 'Accès interdit. Rôle insuffisant.' });
            }

            // Ajouter le rôle spécifique au tournoi dans la requête pour une utilisation ultérieure
            req.user.tourneyRole = userTourneyRole;

            next();
        } catch (error) {
            console.error('Erreur lors de la vérification du rôle dans le tournoi:', error);
            res.status(500).json({ message: 'Erreur serveur' });
        }
    };
};
