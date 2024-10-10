// controllers/sportController.js
const { Sport } = require('../models');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration de multer pour la gestion des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Assurez-vous que ce chemin est correct par rapport à votre projet
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // Limite à 2 Mo
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Veuillez télécharger un fichier JPG ou PNG.'), false);
        }
    }
});

// Créer un sport
exports.createSport = async (req, res) => {
    try {
        const { name, rule, scoreSystem, color } = req.body;

        if (!name || !rule) {
            return res.status(400).json({ message: "Les champs 'name' et 'rule' sont requis." });
        }

        let imagePath = '/public/images/default-sport.png'; // Chemin de l'image par défaut

        if (req.file) {
            imagePath = `/uploads/${req.file.filename}`;
        }

        const newSport = await Sport.create({
            name,
            rule,
            scoreSystem,
            image: imagePath,
            color
        });

        res.status(201).json(newSport);
    } catch (error) {
        console.error('Erreur lors de la création du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la création du sport' });
    }
};

// Récupérer tous les sports
exports.getSports = async (req, res) => {
    try {
        const sports = await Sport.findAll();
        res.status(200).json(sports);
    } catch (error) {
        console.error('Erreur lors de la récupération des sports :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des sports' });
    }
};

// Récupérer un sport par son ID
exports.getSportById = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }
        res.status(200).json(sport);
    } catch (error) {
        console.error('Erreur lors de la récupération du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du sport' });
    }
};

// Mettre à jour un sport
exports.updateSport = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        const { name, rule, scoreSystem, color } = req.body;
        let imagePath = sport.image;

        if (req.file) {
            // Supprimer l'ancienne image si ce n'est pas l'image par défaut
            if (sport.image !== '/public/images/default-sport.png') {
                fs.unlink(path.join(__dirname, '../', sport.image), (err) => {
                    if (err) {
                        console.error("Erreur lors de la suppression de l'ancienne image : ", err);
                    }
                });
            }
            imagePath = `/uploads/${req.file.filename}`;
        }

        await sport.update({
            name,
            rule,
            scoreSystem,
            image: imagePath,
            color
        });

        res.status(200).json(sport);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du sport' });
    }
};

// Supprimer un sport
exports.deleteSport = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        // Supprimer l'image associée si ce n'est pas l'image par défaut
        if (sport.image !== '/public/images/default-sport.png') {
            fs.unlink(path.join(__dirname, '../', sport.image), (err) => {
                if (err) {
                    console.error("Erreur lors de la suppression de l'image :", err);
                }
            });
        }

        await sport.destroy();
        res.status(200).json({ message: 'Sport supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du sport :', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du sport' });
    }
};

// Exporter multer pour les routes
exports.upload = upload.single('image');