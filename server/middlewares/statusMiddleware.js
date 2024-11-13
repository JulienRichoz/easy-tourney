// server/middlewares/statusMiddleware.js
const { Tourney } = require('../models');

/**
 * Middleware pour vérifier si le statut poolStatus est 'active'.
 */
const verifyPoolStatusDraft = async (req, res, next) => {
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé.' });
        }

        if (tourney.poolStatus !== 'draft') {
            return res.status(403).json({ message: 'L\'action requiert que le poolStatus soit en mode édition.' });
        }

        next(); // Passer à la prochaine étape si le statut est correct
    } catch (error) {
        console.error('Erreur lors de la vérification du poolStatus:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

const verifyRegistrationStatusActive = async (req, res, next) => {
    const { tourneyId } = req.params;

    try {
        const tourney = await Tourney.findByPk(tourneyId);
        if (!tourney) {
            return res.status(404).json({ message: 'Tournoi non trouvé.' });
        }

        if (tourney.registrationStatus !== 'active') {
            return res.status(403).json({ message: 'L\'action requiert que le registrationStatus soit actif.' });
        }

        next(); 
    } catch (error) {
        console.error('Erreur lors de la vérification du registrationStatus:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = {
    verifyPoolStatusDraft,
    verifyRegistrationStatusActive,
};
