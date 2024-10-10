// Middleware pour vérifier le rôle de l'utilisateur
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleId)) {
            return res.status(403).json({ message: 'Accès refusé. Rôle non autorisé.' });
        }
        next();
    };
};

// middlewares/authMiddleware.js
exports.isAdmin = (req, res, next) => {
    const user = req.user; // User devrait être défini après la vérification du token
    if (user && user.roleId === 1) { // '1' correspond à l'admin
        return next();
    }
    return res.status(403).json({ message: 'Accès interdit' });
};


module.exports = {
    authorizeRoles,
};
