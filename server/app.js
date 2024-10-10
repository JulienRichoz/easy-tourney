const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { sequelize } = require('./models'); // Vérifiez que c'est bien configuré
const authRoutes = require('./routes/auth');
const sportRoutes = require('./routes/sport'); // Importez les routes des sports
const { errorHandler, limiter } = require('./middlewares'); // Assurez-vous que l'importation correspond au nom dans middlewares/index.js

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter); // Utilisez le middleware de limitation du nombre de requêtes

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes); // Utilisez les routes des sports

// Gestion des erreurs
app.use(errorHandler); // Utilisez le middleware de gestion des erreurs

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});
