// server/controllers/roleController.js
// Controller pour les rôles
const { Role } = require('../models');

/**
 * Récupérer la liste des roles
 * @param {*} req - Request HTTP
 * @param {*} res - Response HTTP
 * @returns {JSON} - Liste des roles
 */
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll({
      attributes: ['id', 'name'],
    });
    res.json(roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
