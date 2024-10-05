const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode'); // Utilise require au lieu de import


// Fonction pour générer un token JWT
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user.id, roleId: user.roleId, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Fonction pour comparer les mots de passe
exports.comparePassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// Fonction pour hasher un mot de passe
exports.hashPassword = async (plainPassword) => {
    return await bcrypt.hash(plainPassword, 10);
};

// Vérifier les permissions basées sur le rôle
exports.hasPermission = (roleId, permission) => {
    const roleKey = Object.keys(roles).find((key) => roles[key] === roleId);
    return permissions[roleKey] && permissions[roleKey].includes(permission);
};

// Vérifier si l'utilisateur est authentifié
exports.isAuthenticated = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log("Token non trouvé dans le localStorage.");
        return false;
    }

    try {
        const decoded = jwtDecode(token);
        console.log("Token décodé:", decoded);
        return decoded && Date.now() <= decoded.exp * 1000;
    } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        return false;
    }
};
