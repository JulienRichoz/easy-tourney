const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
