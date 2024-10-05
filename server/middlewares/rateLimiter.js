const rateLimit = require('express-rate-limit');

// Limiteur pour limiter les requêtes des utilisateurs (ex: 100 requêtes par 15 minutes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limite chaque IP à 200 requêtes par `window` (ici 15 minutes)
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
});

module.exports = limiter;
