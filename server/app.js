require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const authRoutes = require('./routes/auth');

const app = express();

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
