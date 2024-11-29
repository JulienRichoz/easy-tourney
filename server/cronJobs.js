// server/cronJobs.js
// Tâche planifiée pour mettre activer/desactiver automatiquement les statuts tournois
const cron = require('node-cron');
const { Tourney } = require('./models');
const { Op } = require('sequelize');

// Tâche planifiée pour mettre à jour le statut des tournois
cron.schedule('0 * * * *', async () => { // Toutes les heures
    try {
        const today = new Date();
        console.warn('Vérification des statuts des tournois en cours...');

        // Mettre à jour les tournois 'ready' dont la date est aujourd'hui en 'active'
        await Tourney.update(
            { status: 'active' },
            {
                where: {
                    status: 'ready',
                    dateTourney: today, // Tournoi dont la date est aujourd'hui
                },
            }
        );

        // Mettre à jour les tournois 'active' dont la date est passée en 'completed'
        await Tourney.update(
            { status: 'completed' },
            {
                where: {
                    status: 'active',
                    dateTourney: {
                        [Op.lt]: today, // Tournois dont la date est passée
                    },
                },
            }
        );

        console.warn('Statuts des tournois mis à jour');
    } catch (error) {
        console.error('Erreur lors de la mise à jour des statuts des tournois:', error);
    }
});
