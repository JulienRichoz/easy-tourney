// server/app.js
// Purpose: Define the main application file. This file is the entry point of the application.

const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const sportRoutes = require('./routes/sport');
const tourneyRoutes = require('./routes/tourney');
const sportFieldRoutes = require('./routes/sportField');
const fieldRoutes = require('./routes/field');
const teamRoutes = require('./routes/team');

const { errorHandler, limiter } = require('./middlewares');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/tourneys', tourneyRoutes);
app.use('/api/sport-fields', sportFieldRoutes);
app.use('/api/fields', fieldRoutes);
app.use('/api/teams', teamRoutes);

// Gestion des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});
