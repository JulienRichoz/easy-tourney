// server/services/authService.js
// Purpose: Implement the authentication service functions.
// This file contains functions for generating a JWT token, comparing passwords, hashing passwords, checking permissions based on roles, and checking if a user is authenticated.

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { jwtDecode } = require('jwt-decode');

/**
 * Fonction pour générer un token JWT avec une durée d'expiration
 * @param {*} user - Utilisateur pour lequel générer le token
 * @returns - Token JWT
 */
exports.generateToken = (user) => {
  return jwt.sign(
    { id: user.id, roleId: user.roleId, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } // Utilisation de la durée d'expiration de l'environnement
  );
};

/**
 * Comparer deux mots de passe
 * @param {*} plainPassword 
 * @param {*} hashedPassword 
 * @returns - Vrai si les mots de passe correspondent, faux sinon
 */
exports.comparePassword = async (plainPassword, hashedPassword) => {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
};
/**
 * Hasher un mot de passe avec Argon2
 * @param {*} plainPassword
 * @returns - Mot de passe hashé
 */
exports.hashPassword = async (plainPassword) => {
  return await argon2.hash(plainPassword);
};

/**
 * Vérifier les permissions selon le rôle
 * @param {*} roleId - ID du rôle
 * @param {*} permission - Permission à vérifier
 * @returns - Vrai si le rôle a la permission, faux sinon
 */
exports.hasPermission = (roleId, permission) => {
  const roleKey = Object.keys(roles).find((key) => roles[key] === roleId);
  return permissions[roleKey] && permissions[roleKey].includes(permission);
};

/**
 * Vérifier si un utilisateur est authentifié
 * @param {*} token - Token JWT
 * @returns -vrai si le token est valide et non expiré, faux sinon
 */
exports.isAuthenticated = (token) => {
  if (!token) {
    return false;
  }

  try {
    // Vérifier la signature et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Vérifier l'expiration du token
    return decoded && Date.now() <= decoded.exp * 1000;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return false;
  }
};

/**
 * Générer un token d'invitation pour un tournoi
 * @param {*} tourneyId - ID du tournoi
 * @returns - Token d'invitation
 */
exports.generateInviteToken = (tourneyId) => {
  return jwt.sign({ tourneyId, type: 'invite' }, process.env.JWT_SECRET, {
    expiresIn: process.env.INVITE_TOKEN_EXPIRATION || '2w',
  });
};

/**
 * Vérifier un token d'invitation pour un tournoi
 * @param {*} token - Token d'invitation
 * @returns - token décodé ou null si invalide 
 */
exports.verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
};