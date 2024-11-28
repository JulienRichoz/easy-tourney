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
    const date = new Date(data.tourney.dateTourney); // Utiliser la date du tournoi
    date.setHours(startHour, 0, 0, 0);

    while (date.getHours() < endHour) {
        times.push(new Date(date.getTime())); // Ajouter une copie de l'heure actuelle
        date.setMinutes(date.getMinutes() + interval);
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

    // Stocker les positions des cellules déjà fusionnées
    const mergedCells = {};

    // Remplir les lignes avec les horaires
    times.forEach((time, rowIndex) => {
        const timeString = time.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        const row = calendarSheet.addRow([timeString]);

        // Parcourir les terrains pour chaque horaire
        fields.forEach((field, colIndex) => {
            const cellPosition = `${rowIndex + 2},${colIndex + 2}`;
            // Vérifier si cette cellule est déjà fusionnée
            if (mergedCells[cellPosition]) {
                return; // Passer si la cellule est déjà fusionnée
            }

            // Rechercher le match qui couvre ce créneau horaire et ce terrain
            const game = data.games.find(game => {
                const gameStart = new Date(game.startTime);
                const gameEnd = new Date(game.endTime);

                return (
                    game.field.name === field &&
                    time.getTime() >= gameStart.getTime() &&
                    time.getTime() < gameEnd.getTime()
                );
            });

            if (game) {
                // Calculer le nombre de lignes à fusionner en fonction de la durée du match
                const gameStart = new Date(game.startTime);
                const gameEnd = new Date(game.endTime);
                const durationMinutes = (gameEnd - gameStart) / (1000 * 60);
                const rowsToMerge = Math.ceil(durationMinutes / interval);

                // Fusionner les cellules correspondantes
                const startRow = rowIndex + 2;
                const endRow = startRow + rowsToMerge - 1;

                // Enregistrer les positions fusionnées
                for (let i = startRow; i <= endRow; i++) {
                    mergedCells[`${i},${colIndex + 2}`] = true;
                }

                calendarSheet.mergeCells(startRow, colIndex + 2, endRow, colIndex + 2);

                // Préparer le contenu de la cellule
                const cellContent = [
                    `${game.pool?.name || 'N/A'}`,
                    `${game.teamA?.teamName || 'N/A'} vs ${game.teamB?.teamName || 'N/A'}`,
                    `Score: ${game.scoreTeamA || '-'} - ${game.scoreTeamB || '-'}`,
                    `Sport: ${game.sport?.name || 'N/A'}`
                ].join('\n');

                const cell = row.getCell(colIndex + 2); // Colonne correspondante au terrain
                cell.value = cellContent;
                cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

                // Ajouter des couleurs en fonction du sport
                const sportColor = game.sport?.color || 'FFFFFF'; // Couleur du sport ou blanc par défaut
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: sportColor.replace('#', '') },
                };
            } else {
                // Vérifier si c'est une période de transition
                const isTransition = true; // Vous pouvez ajouter votre logique pour déterminer les transitions
                // Liste des périodes de transition avec leurs heures de début et de fin
                const transitions = [
                    {
                        label: 'Introduction',
                        startTime: new Date('2024-11-15T08:00:00'),
                        endTime: new Date('2024-11-15T08:15:00'),
                        color: 'FFD700', // Or
                    },
                    {
                        label: 'Lunch Break',
                        startTime: new Date('2024-11-15T12:00:00'),
                        endTime: new Date('2024-11-15T13:00:00'),
                        color: 'ADD8E6', // Bleu clair
                    },
                    // Ajoutez d'autres transitions si nécessaire
                ];

                // Dans la boucle, avant de vérifier 'isTransition'
                const transition = transitions.find(tr => {
                    return (
                        time.getTime() >= tr.startTime.getTime() &&
                        time.getTime() < tr.endTime.getTime()
                    );
                });

                if (transition) {
                    // Calculer le nombre de lignes à fusionner
                    const durationMinutes = (transition.endTime - transition.startTime) / (1000 * 60);
                    const rowsToMerge = Math.ceil(durationMinutes / interval);

                    const startRow = rowIndex + 2;
                    const endRow = startRow + rowsToMerge - 1;

                    // Enregistrer les positions fusionnées
                    for (let i = startRow; i <= endRow; i++) {
                        mergedCells[`${i},${colIndex + 2}`] = true;
                    }

                    calendarSheet.mergeCells(startRow, colIndex + 2, endRow, colIndex + 2);

                    const cell = row.getCell(colIndex + 2);
                    cell.value = transition.label;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

                    // Couleur pour la transition
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: transition.color },
                    };
                }
                if (isTransition) {
                    // Fusionner les cellules pour la période de transition
                    const startRow = rowIndex + 2;
                    const endRow = startRow; // Peut être ajusté si la transition dure plus d'un intervalle

                    calendarSheet.mergeCells(startRow, colIndex + 2, endRow, colIndex + 2);

                    const cell = row.getCell(colIndex + 2);
                    cell.value = 'Transition';
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

                    // Couleur pour la transition (par exemple, gris clair)
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'CCCCCC' },
                    };
                }
            }
        });
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
