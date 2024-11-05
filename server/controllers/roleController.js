// server/controllers/roleController.js
const { Role } = require('../models');

exports.getRoles = async (req, res) =>{
    try {
        const roles = await Role.findAll({
          attributes: ['id', 'name'],
        });
        res.json(roles);
      } catch (error) {
        console.error('Erreur lors de la récupération des rôles:', error);
        res.status(500).json({ message: 'Erreur serveur' });
      }
}