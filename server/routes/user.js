const express = require('express');
const router = express.Router();
const { getTourneysByUser, getAllUsers, getUserById, createUser, updateUser, deleteUser, getOwnProfile, } = require('../controllers/userController');
const { isAdmin, isAuthenticated, authorizeUserOrAdmin } = require('../middlewares');

// Base URL: http://localhost:3000/api/users/:userId
// 'CRUD' sans Create car géré dans la route auth.js
router.get('/:userId/tourneys', isAuthenticated, authorizeUserOrAdmin, getTourneysByUser); // Récupérer les tournois pour un utilisateur donné
router.get('/', isAuthenticated, isAdmin, getAllUsers);
router.get('/:userId', isAuthenticated, authorizeUserOrAdmin, getUserById);
router.put('/:userId', isAuthenticated, authorizeUserOrAdmin, updateUser);
router.delete('/:userId', isAuthenticated, isAdmin, deleteUser);

module.exports = router;
