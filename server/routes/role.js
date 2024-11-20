// server/routes/user.js
const express = require('express');
const router = express.Router();
const { getRoles } = require('../controllers/roleController');
const { isAuthenticated } = require('../middlewares');

// Base URL: http://localhost:3000/api/roles
router.get('/', isAuthenticated, getRoles); // Récupérer les différents roles

module.exports = router;
