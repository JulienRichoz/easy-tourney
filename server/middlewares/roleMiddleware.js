// Middleware pour vérifier le rôle de l'utilisateur
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleId)) {
            return res.status(403).json({ message: 'Accès refusé. Rôle non autorisé.' });
        }
        next();
    };
};

module.exports = {
    authorizeRoles,
};
