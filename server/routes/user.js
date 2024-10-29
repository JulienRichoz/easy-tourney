const express = require('express');
const router = express.Router();
const { getTourneysByUser, getAllUsers, getUserById, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { isAdmin, isAuthenticated } = require('../middlewares');

// Base URL: http://localhost:3000/api/users/:userId
// 'CRUD' sans Create car géré dans la route auth.js
router.get('/:userId/tourneys', isAuthenticated, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné
router.get('/', isAuthenticated, isAdmin, getAllUsers);
router.get('/:userId', isAuthenticated, getUserById);
router.put('/:userId', isAuthenticated, updateUser);
router.delete('/:userId', isAuthenticated, isAdmin, deleteUser);

module.exports = router;
