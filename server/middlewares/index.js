// server/middlewares/index.js
// Middleware reteamées pour l'authentification, la gestion des erreurs, les limites de requêtes et les rôles

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { roles } = require('../config/roles');
const { UsersTourneys, User } = require('../models');
const {
  verifyPoolStatusDraft,
  verifyRegistrationStatusActive,
  verifyFieldAssignmentStatus,
  verifySportAssignmentStatus,
  verifyPlanningStatus,
} = require('./statusMiddleware');

// Middleware pour authentifier le token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: 'Accès refusé. Aucun token fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Vérifier si l'utilisateur existe toujours dans la base de données
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res
        .status(401)
        .json({
          message: 'Utilisateur non trouvé. Veuillez vous reconnecter.',
        });
    }

    // Définir isAdmin sur la base du roleId
    req.user.isAdmin = req.user.roleId === roles.ADMIN;
    next();
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(403).json({ message: 'Token invalide.' });
  }
};

// Middleware pour gérer les erreurs
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Erreur interne du serveur',
  });
};

// Limiteur de requêtes pour limiter le nombre de requêtes d'une même IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10000, // Limite chaque IP à 10000 requêtes par fenêtre
  message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
  const user = req.user; // Utilisateur doit être défini après la vérification du token
  if (user && user.roleId === roles.ADMIN) {
    return next();
  }
  return res
    .status(403)
    .json({ message: 'Accès interdit. Réservé aux administrateurs.' });
};

// Middleware générique pour vérifier les rôles de l'utilisateur
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.roleId)) {
      return res
        .status(403)
        .json({ message: 'Accès refusé. Rôle non autorisé.' });
    }
    next();
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est soit l'utilisateur lui-même, soit un admin.
 */
const authorizeUserOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.userId, 10);
  const requesterId = req.user.id;
  const requesterRole = req.user.roleId;

  if (requesterRole === roles.ADMIN || requesterId === userId) {
    return next();
  }

  return res
    .status(403)
    .json({
      message:
        'Accès interdit. Vous ne pouvez accéder qu\'à votre propre profil.',
    });
};

/**
 * Middleware pour vérifier si l'utilisateur a accès au tournoi
 */
const authorizeTournamentAccess = async (req, res, next) => {
  try {
    const userId = req.user.id; // ID de l'utilisateur actuel à partir du token
    const tourneyId = parseInt(req.params.tourneyId, 10); // ID du tournoi à partir des paramètres de la route
    const userRole = req.user.roleId;
    if (userRole === roles.ADMIN) return next();
    // Vérifier si l'utilisateur est associé au tournoi
    const userTourney = await UsersTourneys.findOne({
      where: {
        userId,
        tourneyId,
      },
    });

    if (!userTourney) {
      return res
        .status(403)
        .json({
          message: 'Accès interdit. Vous n\'avez pas accès à ce tournoi.',
        });
    }

    next(); // Passer à l'étape suivante si l'utilisateur a accès
  } catch (error) {
    console.error(
      'Erreur lors de la vérification de l\'accès au tournoi:',
      error
    );
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

module.exports = {
  // Auth Middleware
  isAuthenticated: authenticateToken, // Alias pour authenticateToken
  authenticateToken,
  errorHandler,
  limiter,
  isAdmin,
  authorizeRoles,
  authorizeUserOrAdmin,
  authorizeTournamentAccess,

  // Status Middleware
  verifyPoolStatusDraft,
  verifyRegistrationStatusActive,
  verifyFieldAssignmentStatus,
  verifySportAssignmentStatus,
  verifyPlanningStatus,
};
