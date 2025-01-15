// cleanupUploads.js
// Script pour supprimer les fichiers (images) non protégés dans le dossier uploads
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
console.log('uploadsDir:', uploadsDir);
const protectedImages = [
    'badminton.png',
    'basketball.jpg',
    'football.jpg',
    'ultimate.jpeg',
    'volleyball.jpeg',
];

// Fonction pour supprimer les fichiers non protégés
function cleanupUploads() {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Erreur lecture du dossier uploads :', err);
            return;
        }

        files.forEach((file) => {
            if (!protectedImages.includes(file)) {
                const filePath = path.join(uploadsDir, file);
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Impossible de supprimer ${filePath}:`, unlinkErr);
                    } else {
                        console.log(`Fichier supprimé : ${filePath}`);
                    }
                });
            }
        });
    });
}

// On lance la fonction
cleanupUploads();
