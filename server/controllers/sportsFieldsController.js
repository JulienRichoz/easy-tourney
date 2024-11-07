// server/controllers/sportsFieldsController.js
// Contrôleur pour la gestion des associations sportsFields

const { Field, Sport, SportsFields } = require('../models');
const { checkAndUpdateStatuses } = require('../utils/statusUtils'); // Importer l'utilitaire

// Créer une association sportsFields
exports.createSportsFields = async (req, res) => {
    try {
        const tourneyId = req.params.tourneyId;
        const { fieldId, sportId, startTime, endTime, information } = req.body;

        if (!fieldId || !sportId || !startTime || !endTime) {
            return res.status(400).json({ message: "Les champs 'fieldId', 'sportId', 'startTime' et 'endTime' sont requis." });
        }

        // Vérifier si le terrain et le sport existent
        const field = await Field.findByPk(fieldId);
        const sport = await Sport.findByPk(sportId);

        if (!field) {
            return res.status(404).json({ message: 'Terrain non trouvé' });
        }

        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        // Créer l'association sport-terrain
        const sportsFields = await SportsFields.create({
            fieldId,
            sportId,
            startTime,
            endTime,
            information,
        });

        // Mettre à jour les statuts après la création d'une association sport-terrain
        await checkAndUpdateStatuses(tourneyId);

        res.status(201).json(sportsFields);
    } catch (error) {
        console.error('Erreur lors de la création de l\'association sportsFields :', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'association sportsFields' });
    }
};

// Récupérer les sports associés à un tournoi, avec la possibilité de filtrer par terrain
exports.getSportsFieldsByTourney = async (req, res) => {
    try {
      const tourneyId = req.params.tourneyId;
  
      // Récupérer tous les terrains du tournoi
      const fields = await Field.findAll({
        where: { tourneyId },
        include: [
          {
            model: SportsFields,
            as: 'sportsFields',
            include: [
              {
                model: Sport,
                as: 'sport',
                attributes: ['id', 'name', 'rule', 'scoreSystem', 'color', 'image'],
              },
            ],
          },
        ],
      });
  
      if (!fields || fields.length === 0) {
        return res.status(200).json({ message: 'Aucun terrain trouvé. Veuillez créer des terrains.', fields: [] });
    }
  
      res.status(200).json(fields);
    } catch (error) {
      console.error('Erreur lors de la récupération des sports associés aux terrains du tournoi :', error);
      res.status(500).json({ message: 'Erreur lors de la récupération des sports.' });
    }
  };
  
// Récupérer les sports associés à un terrain spécifique
exports.getSportsByField = async (req, res) => {
    try {
        const { fieldId } = req.params;

        const sportsFields = await SportsFields.findAll({
            where: { fieldId },
            include: [
                {
                    model: Sport,
                    as: 'sport',
                    attributes: ['id', 'name', 'rule', 'scoreSystem', 'color', 'image'],
                },
            ],
        });

        if (sportsFields.length === 0) {
            return res.status(404).json({ message: "Aucun sport n'est associé à ce terrain." });
        }

        res.status(200).json(sportsFields);
    } catch (error) {
        console.error('Erreur lors de la récupération des sports par terrain :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sports.' });
    }
};

// Mettre à jour une association sport-terrain
exports.updateSportsFields = async (req, res) => {
    try {
        const { sportsFieldsId } = req.params;
        const { startTime, endTime, fieldId } = req.body;

        const sportsFields = await SportsFields.findByPk(sportsFieldsId);

        if (!sportsFields) {
            return res.status(404).json({ message: "Sport associé au terrain non trouvé" });
        }

        await sportsFields.update({ startTime, endTime, fieldId });

        res.status(200).json(sportsFields);
    } catch (error) {
        console.error("Erreur lors de la mise à jour du sport associé au terrain :", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du sport associé au terrain" });
    }
};

// Supprimer une association sport-terrain
exports.deleteSportsFields = async (req, res) => {
    try {
        const { sportsFieldsId, tourneyId } = req.params;

        // Trouver l'association sport-terrain par son ID
        const sportsFields = await SportsFields.findByPk(sportsFieldsId);

        if (!sportsFields) {
            return res.status(404).json({ message: "Sport-terrain non trouvé." });
        }

        // Supprimer l'association du sport avec le terrain
        await sportsFields.destroy();

        // Mettre à jour les statuts après la suppression d'une association sport-terrain
        await checkAndUpdateStatuses(tourneyId);

        res.status(200).json({ message: 'Sport-terrain supprimé avec succès.' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'association sport-terrain :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'association sport-terrain' });
    }
};
