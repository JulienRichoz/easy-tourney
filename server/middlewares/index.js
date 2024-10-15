// server/middlewares/index.js
// Middleware reteamées pour l'authentification, la gestion des erreurs, les limites de requêtes et les rôles

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Middleware pour authentifier le token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Aucun token fourni.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
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
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limite chaque IP à 200 requêtes par fenêtre de 15 minutes
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = (req, res, next) => {
    const user = req.user; // Utilisateur doit être défini après la vérification du token
    if (user && user.roleId === 1) { // '1' correspond à l'admin
        return next();
    }
    return res.status(403).json({ message: 'Accès interdit. Réservé aux administrateurs.' });
};

// Middleware générique pour vérifier les rôles de l'utilisateur
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleId)) {
            return res.status(403).json({ message: 'Accès refusé. Rôle non autorisé.' });
        }
        next();
    };
};

module.exports = {
    isAuthenticated: authenticateToken, // Alias pour authenticateToken
    authenticateToken,
    errorHandler,
    limiter,
    isAdmin,
    authorizeRoles,
};
