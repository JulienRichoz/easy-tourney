// server/app.js
const express = require('express');
const cors = require('cors');
const http = require('http'); // Nécessaire pour créer le serveur HTTP
const socket = require('./socket'); // Importer le module socket.js
require('dotenv').config();
require('./cronJobs');
const path = require('path');
const { sequelize } = require('./models');

// Import des routes
const authRoutes = require('./routes/auth');
const sportRoutes = require('./routes/sport');
const tourneyRoutes = require('./routes/tourney');
const sportsFieldsRoutes = require('./routes/sportsFields');
const fieldRoutes = require('./routes/field');
const teamRoutes = require('./routes/team');
const teamSetupRoutes = require('./routes/teamSetup');
const usersTourneysRoutes = require('./routes/usersTourneys');
const userRoutes = require('./routes/user');
const roleRoutes = require('./routes/role');
const inviteTokenRoutes = require('./routes/inviteToken');
const poolRoutes = require('./routes/pool');
const gameRoutes = require('./routes/game');
const gameEventRoutes = require('./routes/gameEvent');
const scheduleTourneyRoutes = require('./routes/scheduleTourney');
const poolScheduleRoutes = require('./routes/poolSchedule');
const planningRoutes = require('./routes/planning');
const exportDataRoutes = require('./routes/exportData');

const { errorHandler, limiter } = require('./middlewares');

const app = express();

// Parser les origines autorisées depuis l'environnement
const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];

// CORS
app.use(
  cors({
    origin: corsOrigins,
    credentials: true, // Gestion des cookies d'authentification
  })
);

app.use(express.json());
app.use(limiter);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes globales
app.use('/api/auth', authRoutes);
app.use('/api/sports', sportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);

// Routes centrées sur le tournoi
app.use('/api/tourneys', tourneyRoutes);
app.use('/api/tourneys/:tourneyId/teams', teamRoutes);
app.use('/api/tourneys/:tourneyId/team-setup', teamSetupRoutes);
app.use('/api/tourneys/:tourneyId/fields', fieldRoutes);
app.use('/api/tourneys/:tourneyId/sports-fields', sportsFieldsRoutes);
app.use('/api/tourneys/:tourneyId/users', usersTourneysRoutes);
app.use('/api/tourneys/:tourneyId/invite-token', inviteTokenRoutes);
app.use('/api/tourneys/:tourneyId/pools', poolRoutes);
app.use('/api/tourneys/:tourneyId/games', gameRoutes);
app.use('/api/tourneys/:tourneyId/games/:gameId/events', gameEventRoutes);
app.use('/api/tourneys/:tourneyId/schedule', scheduleTourneyRoutes);
app.use('/api/tourneys/:tourneyId/pools/schedule', poolScheduleRoutes); // Routes pour les plannings des pools
app.use('/api/tourneys/:tourneyId/planning', planningRoutes); // Routes pour la gestion des plannings

// Route pour exporter les données d'un tournoi
app.use('/api/tourneys/:tourneyId/export-data', exportDataRoutes);

// Gestion des erreurs
app.use(errorHandler);

/**
 * WEB SOCKET
 */
// Création du serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.IO via socket.js
const io = socket.init(server);

// Middleware d'authentification pour Socket.IO
const authenticateSocket = require('./socketHandlers/authenticateSocket');
io.use(authenticateSocket);

// Gestionnaires de sockets
require('./socketHandlers/gameSockets')(io);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
sequelize.sync().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});
