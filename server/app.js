require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const rateLimiter = require('./middlewares/rateLimiter'); // Import du rate limiter
const errorHandler = require('./middlewares/errorHandler'); // Import du gestionnaire d'erreurs

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

// Appliquer le rate limiter globalement
app.use(rateLimiter);

// Gestion des erreurs (doit être le dernier middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
