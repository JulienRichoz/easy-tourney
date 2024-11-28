const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Fonction pour générer la feuille de calendrier dans le classeur Excel.
 * @param {ExcelJS.Workbook} workbook - Le classeur Excel.
 * @param {Object} data - Les données du tournoi.
 */
function generateCalendarSheet(workbook, data) {
    const calendarSheet = workbook.addWorksheet('Planning Calendrier');

    // Définir les horaires (axe Y) et terrains (axe X)
    const startHour = 8; // Par exemple, 8h du matin
    const endHour = 18; // Jusqu'à 18h
    const interval = 5; // Intervalle en minutes
    const times = [];

    // Générer les créneaux horaires comme objets Date
    const tourneyDate = new Date(data.tourney.dateTourney); // Utiliser la date du tournoi
    const initialDate = new Date(tourneyDate);
    initialDate.setHours(startHour, 0, 0, 0);

    while (initialDate.getHours() < endHour || (initialDate.getHours() === endHour && initialDate.getMinutes() === 0)) {
        times.push(new Date(initialDate.getTime())); // Ajouter une copie de l'heure actuelle
        initialDate.setMinutes(initialDate.getMinutes() + interval);
    }

    const fields = [...new Set(data.games.map(game => game.field.name))]; // Liste unique des terrains

    // Créer les en-têtes
    calendarSheet.addRow(['Horaires', ...fields]); // Première ligne avec les terrains
    calendarSheet.getRow(1).font = { bold: true };
    calendarSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    fields.forEach((field, index) => {
        calendarSheet.getColumn(index + 2).width = 25; // Ajuster la largeur des colonnes
    });
    calendarSheet.getColumn(1).width = 15; // Largeur pour les horaires

    // Stocker les numéros de ligne pour chaque horaire
    const timeRowMap = {};

    // Générer toutes les lignes pour les horaires
    times.forEach((time, index) => {
        const timeString = time.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const row = calendarSheet.addRow([timeString]);
        const rowNumber = row.number; // Numéro de ligne réel dans la feuille Excel
        timeRowMap[time.getTime()] = rowNumber;

        // Centrer l'alignement des horaires
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Liste des périodes de transition avec leurs heures de début et de fin
    const transitions = [
        {
            label: 'Lunch Break',
            startTime: new Date(tourneyDate.getFullYear(), tourneyDate.getMonth(), tourneyDate.getDate(), 12, 0, 0),
            endTime: new Date(tourneyDate.getFullYear(), tourneyDate.getMonth(), tourneyDate.getDate(), 13, 0, 0),
            color: 'ADD8E6', // Bleu clair
        },
        {
            label: 'Outro',
            startTime: new Date(tourneyDate.getFullYear(), tourneyDate.getMonth(), tourneyDate.getDate(), 17, 0, 0),
            endTime: new Date(tourneyDate.getFullYear(), tourneyDate.getMonth(), tourneyDate.getDate(), 17, 30, 0),
            color: 'CCCCCC', // Gris
        },
        // Ajoutez d'autres transitions si nécessaire
    ];

    // Stocker les positions des cellules déjà fusionnées
    const mergedCells = {};

    // Fonction pour fusionner les cellules en évitant les chevauchements
    function mergeCellsIfPossible(startRow, endRow, colIndex, cellContent, fillColor) {
        // Vérifier qu'il n'y a pas de chevauchement de fusion
        let canMerge = true;
        for (let i = startRow; i <= endRow; i++) {
            if (mergedCells[`${i},${colIndex}`]) {
                canMerge = false;
                break;
            }
        }

        if (canMerge) {
            calendarSheet.mergeCells(startRow, colIndex, endRow, colIndex);

            // Enregistrer les positions fusionnées
            for (let i = startRow; i <= endRow; i++) {
                mergedCells[`${i},${colIndex}`] = true;
            }

            const cell = calendarSheet.getCell(startRow, colIndex);
            cell.value = cellContent;
            cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: fillColor },
            };
        }
    }

    // Remplir les données des matchs
    data.games.forEach(game => {
        const gameStart = new Date(game.startTime);
        const gameEnd = new Date(game.endTime);

        const fieldIndex = fields.indexOf(game.field.name);
        if (fieldIndex !== -1) {
            const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires et de l'indexation à partir de 1

            const startRow = timeRowMap[gameStart.getTime()];
            const endRow = timeRowMap[gameEnd.getTime()] - 1; // Soustraire 1 car l'heure de fin est exclusive

            if (startRow && endRow && startRow <= endRow) {
                // Préparer le contenu de la cellule
                const cellContent = [
                    `${game.pool?.name || 'N/A'}`,
                    `${game.teamA?.teamName || 'N/A'} vs ${game.teamB?.teamName || 'N/A'}`,
                    `Score: ${game.scoreTeamA || '-'} - ${game.scoreTeamB || '-'}`,
                    `Sport: ${game.sport?.name || 'N/A'}`
                ].join('\n');

                // Ajouter des couleurs en fonction du sport
                const sportColor = game.sport?.color || 'FFFFFF'; // Couleur du sport ou blanc par défaut

                // Fusionner les cellules
                mergeCellsIfPossible(startRow, endRow, colIndex, cellContent, sportColor.replace('#', ''));

                // Optionnel: Ajouter une transition après le match
                const rotationStart = new Date(gameEnd.getTime());
                const rotationEnd = new Date(gameEnd.getTime() + 5 * 60000); // 5 minutes rotation

                const rotationStartRow = timeRowMap[rotationStart.getTime()];
                const rotationEndRow = timeRowMap[rotationEnd.getTime()] - 1;

                if (rotationStartRow && rotationEndRow && rotationStartRow <= rotationEndRow) {
                    const rotationCellContent = 'Rotation Team';
                    const rotationColor = '808080'; // Gris

                    mergeCellsIfPossible(rotationStartRow, rotationEndRow, colIndex, rotationCellContent, rotationColor);
                }
            }
        }
    });

    // Remplir les transitions
    transitions.forEach(transition => {
        const transitionStart = new Date(transition.startTime);
        const transitionEnd = new Date(transition.endTime);

        const startRow = timeRowMap[transitionStart.getTime()];
        const endRow = timeRowMap[transitionEnd.getTime()] - 1;

        if (startRow && endRow && startRow <= endRow) {
            fields.forEach((field, fieldIndex) => {
                const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires

                mergeCellsIfPossible(startRow, endRow, colIndex, transition.label, transition.color);
            });
        }
    });

    // Appliquer les bordures aux cellules
    calendarSheet.eachRow(row => {
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });

    // Ajuster la hauteur des lignes pour mieux afficher le texte
    calendarSheet.eachRow((row, rowNumber) => {
        row.height = 20; // Ajuster selon vos besoins
    });
}

module.exports = { generateCalendarSheet };

/**
 * Fonction principale pour générer le fichier Excel.
 * @param {Object} data - Les données du tournoi.
 * @param {number|string} tourneyId - L'ID du tournoi.
 * @returns {string} - Le chemin du fichier Excel généré.
 */
async function generateExcelFile(data, tourneyId) {
    const workbook = new ExcelJS.Workbook();

    // **Feuille 1: Informations générales**
    const generalSheet = workbook.addWorksheet('Informations générales');
    generalSheet.columns = [
        { header: "Nom du tournoi", key: "name", width: 20 },
        { header: "Lieu", key: "location", width: 20 },
        { header: "Date", key: "date", width: 15 },
        { header: "Nombre d'inscrits", key: "numUsers", width: 20 },
        { header: "Nombre de pools", key: "numPools", width: 15 },
        { header: "Nombre d'équipes", key: "numTeams", width: 15 },
        { header: "Nombre max d'utilisateurs par équipe", key: "maxUsersPerTeam", width: 35 },
        { header: "Nombre max d'équipes par pool", key: "maxTeamsPerPool", width: 30 },
        { header: "Sports du tournoi", key: "sports", width: 40 },
    ];

    generalSheet.addRow({
        name: data.tourney.name,
        location: data.tourney.location,
        date: data.tourney.dateTourney,
        numUsers: data.users.length,
        numPools: data.pools.length,
        numTeams: data.pools.reduce((acc, pool) => acc + pool.teams.length, 0),
        maxUsersPerTeam: data.teamSetup?.playerPerTeam || "Non défini",
        maxTeamsPerPool: data.tourney?.defaultMaxTeamPerPool || "Non défini",
        sports: [...new Set(data.fields.flatMap(field =>
            field.sportsFields.map(sportField => sportField.sport.name)
        ))].join(', '),
    });

    // **Feuille 2: Utilisateurs**
    const userSheet = workbook.addWorksheet('Utilisateurs');
    userSheet.columns = [
        { header: "Nom", key: "name", width: 20 },
        { header: "Email", key: "email", width: 30 },
        { header: "Équipe", key: "team", width: 20 },
    ];

    data.users.forEach(user => {
        userSheet.addRow({
            name: user.user.name,
            email: user.user.email,
            team: user.teamId
                ? data.pools.find(pool =>
                    pool.teams.find(team => team.id === user.teamId)
                )?.name || "Aucune"
                : "Aucune",
        });
    });

    // **Feuille 3: Planning des Pools**
    const poolsSheet = workbook.addWorksheet('Planning des Pools'); // Déclaré ici
    poolsSheet.columns = [
        { header: "Terrain", key: "field", width: 20 },
        { header: "Pool", key: "pool", width: 15 },
        { header: "Sport", key: "sport", width: 20 },
        { header: "Début", key: "start", width: 15 },
        { header: "Fin", key: "end", width: 15 },
    ];

    data.pools.forEach(pool => {
        pool.schedules.forEach(schedule => {
            poolsSheet.addRow({
                field: schedule.field?.name || "Non défini",
                pool: pool.name,
                sport: schedule.sport?.name || "Non défini",
                start: schedule.startTime || "Non défini",
                end: schedule.endTime || "Non défini",
            });
        });
    });

    // **Feuille 4: Planning des Matchs**
    const gamesSheet = workbook.addWorksheet('Planning des Matchs');
    gamesSheet.columns = [
        { header: "Équipe A", key: "teamA", width: 20 },
        { header: "Équipe B", key: "teamB", width: 20 },
        { header: "Terrain", key: "field", width: 20 },
        { header: "Sport", key: "sport", width: 20 },
        { header: "Début", key: "start", width: 25 },
        { header: "Fin", key: "end", width: 25 },
        { header: "Score Équipe A", key: "scoreA", width: 15 },
        { header: "Score Équipe B", key: "scoreB", width: 15 },
    ];

    data.games.forEach(game => {
        gamesSheet.addRow({
            teamA: game.teamA?.teamName || "N/A",
            teamB: game.teamB?.teamName || "N/A",
            field: game.field?.name || "Non défini",
            sport: game.sport?.name || "Non défini",
            start: game.startTime
                ? new Date(`${game.startTime}`).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : "Non défini",
            end: game.endTime
                ? new Date(`${game.endTime}`).toLocaleString('fr-FR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : "Non défini",
            scoreA: game.scoreTeamA || "Non joué",
            scoreB: game.scoreTeamB || "Non joué",
        });
    });

    // **Génération de la feuille calendrier**
    generateCalendarSheet(workbook, data);

    // Sauvegarde du fichier
    const filePath = path.resolve(__dirname, `../exports/tournament_${tourneyId}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

module.exports = generateExcelFile;
