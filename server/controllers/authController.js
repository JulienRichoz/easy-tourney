// server/controllers/authController.js

const { User, Role } = require('../models');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const mailerService = require("../services/mailerService");

/**
 * Inscription d'un nouvel utilisateur.
 * @param {*} req - La requête HTTP.
 * @param {*} res - La réponse HTTP.
 * @returns res - La réponse HTTP en JSON
 */
exports.register = async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body;

  // Tester les regex pour l'email et le mot de passe
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // Email valide
  const passwordRegex = /^(?=.*[A-Z]).{8,}$/; // Au moins 8 caractères et une majuscule

  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Adresse email invalide." });
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message: "Le mot de passe doit contenir au moins 8 caractères et une majuscule.",
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Les mots de passe ne correspondent pas." });
  }

  // Vérifier si l'email est déjà utilisé
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: 'Cet email est déjà utilisé. Veuillez en choisir un autre.',
        });
    }
    const hashedPassword = await authService.hashPassword(password);

    // Assigner le rôle 'User' par défaut
    const userRole = await Role.findOne({ where: { name: 'User' } });
    if (!userRole) {
      return res
        .status(500)
        .json({
          message: 'Le rôle "User" n\'existe pas dans la base de données.',
        });
    }

    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      roleId: userRole.id,
    });

    const token = authService.generateToken(newUser);
    const decodedToken = jwt.decode(token); // Décoder le token pour récupérer l'expiration

    res.status(201).json({
      token,
      expiresIn: decodedToken.exp, // Temps d'expiration (timestamp UNIX)
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.roleId,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription :', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

/**
 * Connexion d'un utilisateur existant.
 * @param {*} req - La requête HTTP.
 * @param {*} res - La réponse HTTP. 
 * @returns res - La réponse HTTP en JSON
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await authService.comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const token = authService.generateToken(user);
    const decodedToken = jwt.decode(token); // Décoder le token pour récupérer l'expiration

    return res.json({
      token,
      expiresIn: decodedToken.exp, // Expiration en timestamp UNIX
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.roleId,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erreur serveur', error });
  }
};

/**
 * Rafraîchir le token d'authentification.
 * @param {*} req - La requête HTTP.
 * @param {*} res - La réponse HTTP.
 * @returns res - La réponse HTTP en JSON
 */
exports.refreshToken = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Utilisateur non authentifié.' });
    }

    const userId = req.user.id;
    const roleId = req.user.roleId;

    const newToken = authService.generateToken({
      id: userId,
      roleId,
      name: req.user.name,
    });
    const decodedToken = jwt.decode(newToken);

    return res.json({
      token: newToken,
      expiresIn: decodedToken.exp, // Renvoie également le nouveau timestamp d'expiration
    });
  } catch (error) {
    console.error(
      'Erreur lors de la création du token de rafraîchissement:',
      error
    );
    return res
      .status(500)
      .json({
        message: 'Erreur lors de la création du token de rafraîchissement',
      });
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté.
 * @param {*} req 
 * @param {*} res 
 * @returns res - La réponse HTTP en JSON
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }, // Exclure le mot de passe des informations retournées
    });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

/**
 * Oubli du mot de passe : envoi d'un email de réinitialisation.
 * @param {*} req 
 * @param {*} res 
 * @returns res - La réponse HTTP en JSON
 */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    // Générer un token de réinitialisation
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Enregistrer le token temporairement (champ resetToken)
    user.resetToken = resetToken;
    await user.save();

    // Envoyer l'email
    await mailerService.sendPasswordReset(email, resetLink);

    res.json({ message: 'Un lien de réinitialisation a été envoyé.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

/**
 * Réinitialisation du mot de passe.
 * @param {*} req 
 * @param {*} res 
 * @returns res - La réponse HTTP en JSON
 */
exports.resetPassword = async (req, res) => {
  const { token, password, confirmPassword } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token de réinitialisation manquant.' });
  }

  if (!password || !confirmPassword) {
    return res.status(400).json({ message: 'Le mot de passe et sa confirmation sont requis.' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Les mots de passe ne correspondent pas.' });
  }

  // Valider le format du mot de passe
  const passwordRegex = /^(?=.*[A-Z]).{8,}$/; // Au moins 8 caractères et une majuscule

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      message:
        'Le mot de passe doit contenir au moins 8 caractères et une majuscule.',
    });
  }

  // Réinitialiser le mot de passe
  try {
    // Rechercher l'utilisateur par le resetToken
    const user = await User.findOne({ where: { resetToken: token } });

    if (!user) {
      return res.status(400).json({ message: 'Token de réinitialisation invalide ou expiré.' });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await authService.hashPassword(password);

    // Mettre à jour le mot de passe et supprimer le resetToken
    user.password = hashedPassword;
    user.resetToken = null;
    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe :', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};
