const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const router = express.Router();

// Inscription avec rôle
router.post('/register', async (req, res) => {
  const { name, email, password, roleId } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, roleId });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// Connexion
// Route de connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Trouver l'utilisateur dans la base de données
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // 2. Vérifier le mot de passe avec bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // 3. Générer un token JWT pour l'utilisateur
    const token = jwt.sign({ id: user.id, roleId: user.roleId, name: user.name }, 'secretKey', { expiresIn: '1h' });

    // 4. Envoyer la réponse avec le token et les informations utilisateur
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
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
