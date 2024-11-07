// controllers/inviteTokenController.js

const { InviteToken, Tourney } = require('../models');
const authService = require('../services/authService');

// Générer un token d'invitation
exports.generateInviteToken = async (req, res) => {
  const { id } = req.params; // tourneyId
  const { expiresInDays } = req.body; // Durée de validité du token en jours

  try {
    // Vérifier que le tournoi existe
    const tourney = await Tourney.findByPk(id);
    if (!tourney) {
      return res.status(404).json({ message: 'Tournoi non trouvé.' });
    }

    // Créer un token d'invitation
    const token = authService.generateInviteToken(id);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiresInDays || 7)); // Par défaut, 7 jours si non spécifié

    // Enregistrer le token dans la base de données
    const newInviteToken = await InviteToken.create({
      token,
      tourneyId: id,
      expiresAt,
      isValid: true,
    });

    res.status(200).json({ token: newInviteToken.token, expiresAt: newInviteToken.expiresAt });
  } catch (error) {
    console.error('Erreur lors de la génération du token d\'invitation:', error);
    res.status(500).json({ message: 'Erreur serveur lors de la génération du token d\'invitation.' });
  }
};

// Récupérer tous les tokens d'invitation pour un tournoi
exports.getAllInviteTokens = async (req, res) => {
    const { tourneyId } = req.query; // ID du tournoi passé en paramètre de requête
  
    try {
      // Vérifier que le tournoi existe
      const tourney = await Tourney.findByPk(tourneyId);
      if (!tourney) {
        return res.status(404).json({ message: 'Tournoi non trouvé.' });
      }
  
      // Récupérer tous les tokens pour ce tournoi
      const inviteTokens = await InviteToken.findAll({
        where: { tourneyId },
      });
  
      res.status(200).json({ inviteTokens });
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens d\'invitation:', error);
      res.status(500).json({ message: 'Erreur serveur lors de la récupération des tokens.' });
    }
  };

// Invalider un token spécifique
exports.invalidateInviteToken = async (req, res) => {
    const { tokenId } = req.params; // ID du token passé en paramètre de route
  
    try {
      const token = await InviteToken.findByPk(tokenId);
      if (!token) {
        return res.status(404).json({ message: 'Token non trouvé.' });
      }
  
      // Invalider le token
      await token.update({ isValid: false });
  
      res.status(200).json({ message: 'Token invalidé avec succès.' });
    } catch (error) {
      console.error('Erreur lors de l\'invalidation du token:', error);
      res.status(500).json({ message: 'Erreur serveur lors de l\'invalidation du token.' });
    }
  };

exports.invalidateTokensForTourney = async (tourneyId) => {
    try {
        await InviteToken.update(
            { isValid: false },
            { where: { tourneyId } }
        );
        console.log(`Tous les tokens d'invitation pour le tournoi ${tourneyId} ont été invalidés.`);
    } catch (error) {
        console.error(`Erreur lors de l'invalidation des tokens pour le tournoi ${tourneyId}:`, error);
    }
};