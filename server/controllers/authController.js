const { User } = require('../models');
const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

// Inscription
exports.register = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Cet email est déjà utilisé. Veuillez en choisir un autre.' });
        }

        const hashedPassword = await authService.hashPassword(password);
        const newUser = await User.create({ name, email, password: hashedPassword, roleId });

        const token = authService.generateToken(newUser);

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.roleId,
            },
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription :', error); // Ajoute ce log
        res.status(500).json({ message: 'Erreur serveur', error });
    }
};


// Connexion
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
        }

        const isMatch = await authService.comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Mot de passe incorrect' });
        }

        const token = authService.generateToken(user);

        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.roleId,
            },
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Erreur serveur', error });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        // Vérifier si l'utilisateur est bien authentifié
        if (!req.user) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const userId = req.user.id;
        const roleId = req.user.roleId;

        // Générer un nouveau token JWT
        const newToken = jwt.sign(
            { id: userId, roleId: roleId, name: req.user.name },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        return res.json({ token: newToken });
    } catch (error) {
        console.error('Erreur lors de la création du token de rafraîchissement:', error);
        return res.status(500).json({ message: 'Erreur lors de la création du token de rafraîchissement' });
    }
};


exports.getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } // Exclure le mot de passe des informations retournées
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