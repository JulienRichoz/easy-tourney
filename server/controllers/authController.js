const { User } = require('../models');
const authService = require('../services/authService');

// Inscription
exports.register = async (req, res) => {
    const { name, email, password, roleId } = req.body;

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
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
        console.error(error);
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