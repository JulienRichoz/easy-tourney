// server/services/authService.js
// Purpose: Implement the authentication service functions. 
// This file contains functions for generating a JWT token, comparing passwords, hashing passwords, checking permissions based on roles, and checking if a user is authenticated.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');


// Fonction pour générer un token JWT avec une durée d'expiration variable
exports.generateToken = (user) => {
    return jwt.sign(
        { id: user.id, roleId: user.roleId, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }  // Utilisation de la durée d'expiration de l'environnement
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
exports.isAuthenticated = (token) => {
    if (!token) {
        return false;
    }

    try {
        const decoded = jwtDecode(token);
        return decoded && Date.now() <= decoded.exp * 1000; // Vérifie l'expiration
    } catch (error) {
        console.error("Erreur lors de la vérification du token:", error);
        return false;
    }
};
