// server/controllers/authController.js

const { User, Role } = require('../models');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

// Inscription
exports.register = async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé. Veuillez en choisir un autre.' });
        }
        const hashedPassword = await authService.hashPassword(password);
        const newUser = await User.create({
            name,
            email,
            phone,
            password: hashedPassword,
        });

        const token = authService.generateToken(newUser);
        const decodedToken = jwt.decode(token);  // Décoder le token pour récupérer l'expiration

        res.status(201).json({
            token,
            expiresIn: decodedToken.exp, // Temps d'expiration (timestamp UNIX)
            user: {
                id: newUser.id,
                name: newUser.name,
                phone: newUser.phone,
                email: newUser.email,
            },
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error);
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};

// Connexion
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
        const decodedToken = jwt.decode(token);  // Décoder le token pour récupérer l'expiration

        return res.json({
            token,
            expiresIn: decodedToken.exp,  // Expiration en timestamp UNIX
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

// Rafraîchir le token
exports.refreshToken = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const userId = req.user.id;
        const roleId = req.user.roleId;

        const newToken = authService.generateToken({ id: userId, roleId, name: req.user.name });
        const decodedToken = jwt.decode(newToken);

        return res.json({
            token: newToken,
            expiresIn: decodedToken.exp  // Renvoie également le nouveau timestamp d'expiration
        });
    } catch (error) {
        console.error('Erreur lors de la création du token de rafraîchissement:', error);
        return res.status(500).json({ message: 'Erreur lors de la création du token de rafraîchissement' });
    }
};

// Récupérer le profil de l'utilisateur
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }  // Exclure le mot de passe des informations retournées
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
