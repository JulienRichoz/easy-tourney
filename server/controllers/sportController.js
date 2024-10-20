// server/controllers/sportController.js
// Contrôleur pour la gestion des sports

const { Sport } = require('../models');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuration de multer pour la gestion des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limite à 10 Mo
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Veuillez télécharger une image au format JPG, PNG, GIF ou WEBP.'), false);
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

        let imagePath = '/public/images/default-sport.png';

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

// Liste des images à protéger (à ne pas supprimer)
const protectedImages = [
    'badminton.png',
    'basketball.jpg',
    'football.jpg',
    'ultimate.jpeg',
    'volleyball.jpeg',
];
// Supprimer un sport
exports.deleteSport = async (req, res) => {
    try {
        const sport = await Sport.findByPk(req.params.id);
        if (!sport) {
            return res.status(404).json({ message: 'Sport non trouvé' });
        }

        // Supprimer l'image associée si ce n'est pas l'image par défaut et si ce n'est pas une image protégée
        if (sport.image !== '/public/images/default-sport.png') {
            const imageName = path.basename(sport.image); // Récupérer juste le nom du fichier
            const isProtected = protectedImages.includes(imageName); // Vérifier si l'image est protégée

            if (!isProtected) {
                fs.unlink(path.join(__dirname, '../', sport.image), (err) => {
                    if (err) {
                        console.error("Erreur lors de la suppression de l'image :", err);
                    }
                });
            } else {
                console.log(`L'image ${imageName} est protégée et ne sera pas supprimée.`);
            }
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