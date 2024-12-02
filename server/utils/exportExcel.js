// utils/exportExcel.js
const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Fonction pour générer la feuille de calendrier dans le classeur Excel.
 * @param {ExcelJS.Workbook} workbook - Le classeur Excel.
 * @param {Object} data - Les données du tournoi.
 */
function generateCalendarSheet(workbook, data) {
    const calendarSheet = workbook.addWorksheet('Planning Calendrier');
    const poolSchedule = data.schedule;

    // Récupérer la date du tournoi
    const tourneyDate = data.tourney.dateTourney;

    // Récupérer les horaires de début et de fin du planning global
    const scheduleStartTime = new Date(`${tourneyDate}T${poolSchedule.startTime || '08:00:00'}`);
    const scheduleEndTime = new Date(`${tourneyDate}T${poolSchedule.endTime || '18:00:00'}`);

    // Récupérer les horaires de début et de fin des matchs
    const matchTimes = data.games.flatMap(game => [
        new Date(game.startTime),
        new Date(game.endTime)
    ]);
    // Récupérer les horaires de début et de fin des transitions
    const transitionTimes = [];
    if (poolSchedule.introStart && poolSchedule.introEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.introStart}`),
            new Date(`${tourneyDate}T${poolSchedule.introEnd}`),
        );
    }

    if (poolSchedule.lunchStart && poolSchedule.lunchEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.lunchStart}`),
            new Date(`${tourneyDate}T${poolSchedule.lunchEnd}`)
        );
    }

    if (poolSchedule.outroStart && poolSchedule.outroEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.outroStart}`),
            new Date(`${tourneyDate}T${poolSchedule.outroEnd}`)
        );
    }

    // Combiner tous les horaires
    let allTimes = [
        scheduleStartTime,
        scheduleEndTime,
        ...matchTimes,
        ...transitionTimes
    ];

    // Supprimer les doublons et trier les horaires
    allTimes = Array.from(new Set(allTimes.map(time => time.getTime()))).sort().map(time => new Date(time));

    // Générer les intervalles entre les horaires
    const intervals = [];

    for (let i = 0; i < allTimes.length - 1; i++) {
        intervals.push({
            start: allTimes[i],
            end: allTimes[i + 1]
        });
    }

    const fields = [...new Set(data.games.map(game => game.field.name))]; // Liste unique des terrains

    // Créer les en-têtes
    calendarSheet.addRow(['Horaires', ...fields]); // Première ligne avec les terrains
    calendarSheet.getRow(1).font = { bold: true };
    calendarSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    fields.forEach((field, index) => {
        calendarSheet.getColumn(index + 2).width = 25; // Ajuster la largeur des colonnes
    });
    calendarSheet.getColumn(1).width = 20; // Largeur pour les horaires

    // Générer les lignes du planning
    intervals.forEach(interval => {
        const startTimeString = interval.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endTimeString = interval.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const timeRange = `${startTimeString} - ${endTimeString}`;
        const row = calendarSheet.addRow([timeRange]);
        const rowNumber = row.number;
        interval.rowNumber = rowNumber; // Enregistrer le numéro de ligne pour référence
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 20; // Ajuster selon vos besoins
    });

    // Fonction pour vérifier si un intervalle chevauche un événement
    function doesOverlap(eventStart, eventEnd, intervalStart, intervalEnd) {
        return eventStart < intervalEnd && eventEnd > intervalStart;
    }

    // Remplir les données des matchs
    data.games.forEach(game => {
        const gameStart = new Date(game.startTime);
        const gameEnd = new Date(game.endTime);
        const fieldIndex = fields.indexOf(game.field.name);
        if (fieldIndex !== -1) {
            const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires
            intervals.forEach(interval => {
                if (doesOverlap(gameStart, gameEnd, interval.start, interval.end)) {
                    const cell = calendarSheet.getCell(interval.rowNumber, colIndex);
                    const existingValue = cell.value || '';
                    const cellContent = [
                        `Pool: ${game.pool?.name || 'N/A'}`,
                        `${game.teamA?.teamName || 'N/A'} vs ${game.teamB?.teamName || 'N/A'}`,
                        `Score: ${game.scoreTeamA || '-'} - ${game.scoreTeamB || '-'}`,
                        `Sport: ${game.sport?.name || 'N/A'}`
                    ].join('\n');
                    cell.value = existingValue ? existingValue + '\n\n' + cellContent : cellContent;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: (game.sport?.color || '#FFFFFF').replace('#', '') },
                    };
                }
            });
        }
    });

    // Remplir les transitions
    const transitions = [];

    // Introduction
    if (poolSchedule.introStart && poolSchedule.introEnd) {
        transitions.push({
            label: 'Introduction',
            startTime: new Date(`${tourneyDate}T${poolSchedule.introStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.introEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    // Déjeuner
    if (poolSchedule.lunchStart && poolSchedule.lunchEnd) {
        transitions.push({
            label: 'Lunch Break',
            startTime: new Date(`${tourneyDate}T${poolSchedule.lunchStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.lunchEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    // Conclusion
    if (poolSchedule.outroStart && poolSchedule.outroEnd) {
        transitions.push({
            label: 'Outro',
            startTime: new Date(`${tourneyDate}T${poolSchedule.outroStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.outroEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    // Ajouter les transitions de pools
    const poolTransitionTime = poolSchedule.transitionPoolTime || 0;
    if (poolTransitionTime > 0) {
        // Obtenir les horaires de fin des pools
        const poolEndTimes = data.poolSchedules.map(poolSchedule => ({
            field: poolSchedule.field.name,
            endTime: new Date(`${tourneyDate}T${poolSchedule.endTime}`)
        }));

        // Parcourir les pools pour ajouter les transitions
        poolEndTimes.forEach(poolEnd => {
            const transitionStart = poolEnd.endTime;
            const transitionEnd = new Date(transitionStart.getTime() + poolTransitionTime * 60000);

            transitions.push({
                label: 'Transition de Pool',
                startTime: transitionStart,
                endTime: transitionEnd,
                field: poolEnd.field,
                color: 'CCCCCC', // Gris
            });
        });
    }

    // Afficher les transitions dans le planning
    transitions.forEach(transition => {
        intervals.forEach(interval => {
            if (doesOverlap(transition.startTime, transition.endTime, interval.start, interval.end)) {
                fields.forEach((field, fieldIndex) => {
                    // Si la transition est spécifique à un terrain (pour les transitions de pool)
                    if (transition.field && transition.field !== field) return;

                    const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires
                    const cell = calendarSheet.getCell(interval.rowNumber, colIndex);
                    const existingValue = cell.value || '';
                    cell.value = existingValue ? existingValue + '\n' + transition.label : transition.label;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: transition.color },
                    };
                });
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
}

module.exports = { generateCalendarSheet };

/**
 * Fonction pour générer la feuille de calendrier des pools dans le classeur Excel.
 * @param {ExcelJS.Workbook} workbook - Le classeur Excel.
 * @param {Object} data - Les données du tournoi.
 */
function generatePoolCalendarSheet(workbook, data) {
    const poolCalendarSheet = workbook.addWorksheet('Planning Pools');

    const poolSchedule = data.schedule;

    data.poolSchedules = [];
    data.pools.forEach(pool => {
        pool.schedules.forEach(schedule => {
            data.poolSchedules.push({
                pool: { id: pool.id, name: pool.name },
                field: schedule.field,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                sport: schedule.sport,
            });
        });
    });

    // Helper function to check if two events overlap
    function doesOverlap(eventStart, eventEnd, intervalStart, intervalEnd) {
        return eventStart < intervalEnd && eventEnd > intervalStart;
    }

    // Récupérer la date du tournoi
    const tourneyDate = data.tourney.dateTourney;

    // Récupérer les horaires de début et de fin du planning global
    const scheduleStartTime = new Date(`${tourneyDate}T${poolSchedule.startTime || '08:00:00'}`);
    const scheduleEndTime = new Date(`${tourneyDate}T${poolSchedule.endTime || '18:00:00'}`);

    // Récupérer les horaires de début et de fin des pools
    const poolTimes = data.poolSchedules.flatMap(poolSchedule => [
        new Date(`${tourneyDate}T${poolSchedule.startTime}`),
        new Date(`${tourneyDate}T${poolSchedule.endTime}`)
    ]);

    // Récupérer les horaires de début et de fin des transitions
    const transitionTimes = [];
    if (poolSchedule.introStart && poolSchedule.introEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.introStart}`),
            new Date(`${tourneyDate}T${poolSchedule.introEnd}`),
        );
    }

    if (poolSchedule.lunchStart && poolSchedule.lunchEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.lunchStart}`),
            new Date(`${tourneyDate}T${poolSchedule.lunchEnd}`)
        );
    }

    if (poolSchedule.outroStart && poolSchedule.outroEnd) {
        transitionTimes.push(
            new Date(`${tourneyDate}T${poolSchedule.outroStart}`),
            new Date(`${tourneyDate}T${poolSchedule.outroEnd}`)
        );
    }

    // Combiner tous les horaires
    let allTimes = [
        scheduleStartTime,
        scheduleEndTime,
        ...poolTimes,
        ...transitionTimes
    ];

    // Supprimer les doublons et trier les horaires
    allTimes = Array.from(new Set(allTimes.map(time => time.getTime()))).sort().map(time => new Date(time));

    // Générer les intervalles entre les horaires
    const intervals = [];

    for (let i = 0; i < allTimes.length - 1; i++) {
        intervals.push({
            start: allTimes[i],
            end: allTimes[i + 1]
        });
    }

    const fields = [...new Set(data.poolSchedules.map(poolSchedule => poolSchedule.field.name))]; // Liste unique des terrains

    // Créer les en-têtes
    poolCalendarSheet.addRow(['Horaires', ...fields]); // Première ligne avec les terrains
    poolCalendarSheet.getRow(1).font = { bold: true };
    poolCalendarSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    fields.forEach((field, index) => {
        poolCalendarSheet.getColumn(index + 2).width = 25; // Ajuster la largeur des colonnes
    });
    poolCalendarSheet.getColumn(1).width = 20; // Largeur pour les horaires

    // Générer les lignes du planning
    intervals.forEach(interval => {
        const startTimeString = interval.start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const endTimeString = interval.end.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const timeRange = `${startTimeString} - ${endTimeString}`;
        const row = poolCalendarSheet.addRow([timeRange]);
        const rowNumber = row.number;
        interval.rowNumber = rowNumber; // Enregistrer le numéro de ligne pour référence
        row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
        row.height = 20; // Ajuster selon vos besoins
    });

    // Générer des couleurs dynamiques pour les pools
    const poolColors = {};
    const generateColor = (poolId) => {
        if (!poolColors[poolId]) {
            const hue = (poolId * 137.508) % 360; // Nombre d'or pour une distribution uniforme
            poolColors[poolId] = `hsl(${hue}, 70%, 80%)`;
        }
        return poolColors[poolId];
    };

    // Fonction pour convertir une couleur HSL en hexadécimal
    function hslToHex(hsl) {
        const [h, sRaw, lRaw] = hsl.match(/[\d.]+/g).map(Number);
        const s = sRaw / 100;
        const l = lRaw / 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
        g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
        b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
        return `${r}${g}${b}`.toUpperCase();
    }

    // Remplir les données des pools
    data.poolSchedules.forEach(poolSchedule => {
        const poolStart = new Date(`${tourneyDate}T${poolSchedule.startTime}`);
        const poolEnd = new Date(`${tourneyDate}T${poolSchedule.endTime}`);
        const fieldIndex = fields.indexOf(poolSchedule.field.name);
        if (fieldIndex !== -1) {
            const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires
            intervals.forEach(interval => {
                if (doesOverlap(poolStart, poolEnd, interval.start, interval.end)) {
                    const cell = poolCalendarSheet.getCell(interval.rowNumber, colIndex);
                    const existingValue = cell.value || '';
                    const cellContent = [
                        `Pool: ${poolSchedule.pool.name}`,
                        `Sport: ${poolSchedule.sport?.name || 'N/A'}`
                    ].join('\n');
                    cell.value = existingValue ? existingValue + '\n\n' + cellContent : cellContent;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

                    // Générer une couleur pour la pool
                    const hslColor = generateColor(poolSchedule.pool.id);
                    const hexColor = hslToHex(hslColor);

                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: hexColor },
                    };
                }
            });
        }
    });



    // Remplir les données des pools
    data.poolSchedules.forEach(poolSchedule => {
        const poolStart = new Date(`${tourneyDate}T${poolSchedule.startTime}`);
        const poolEnd = new Date(`${tourneyDate}T${poolSchedule.endTime}`);
        const fieldIndex = fields.indexOf(poolSchedule.field.name);
        if (fieldIndex !== -1) {
            const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires
            intervals.forEach(interval => {
                if (doesOverlap(poolStart, poolEnd, interval.start, interval.end)) {
                    const cell = poolCalendarSheet.getCell(interval.rowNumber, colIndex);
                    const existingValue = cell.value || '';
                    const cellContent = [
                        `Pool: ${poolSchedule.pool.name}`,
                        `Sport: ${poolSchedule.sport?.name || 'N/A'}`
                    ].join('\n');
                    cell.value = existingValue ? existingValue + '\n\n' + cellContent : cellContent;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };

                    // Générer une couleur pour la pool
                    const color = hslToHex(generateColor(poolSchedule.pool.id));

                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: color },
                    };
                }
            });
        }
    });

    // Afficher les transitions (Introduction, Déjeuner, Outro)
    const transitions = [];

    // Introduction
    if (poolSchedule.introStart && poolSchedule.introEnd) {
        transitions.push({
            label: 'Introduction',
            startTime: new Date(`${tourneyDate}T${poolSchedule.introStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.introEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    // Déjeuner
    if (poolSchedule.lunchStart && poolSchedule.lunchEnd) {
        transitions.push({
            label: 'Lunch Break',
            startTime: new Date(`${tourneyDate}T${poolSchedule.lunchStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.lunchEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    // Conclusion
    if (poolSchedule.outroStart && poolSchedule.outroEnd) {
        transitions.push({
            label: 'Outro',
            startTime: new Date(`${tourneyDate}T${poolSchedule.outroStart}`),
            endTime: new Date(`${tourneyDate}T${poolSchedule.outroEnd}`),
            color: 'ADD8E6', // Bleu clair
        });
    }

    transitions.forEach(transition => {
        intervals.forEach(interval => {
            if (doesOverlap(transition.startTime, transition.endTime, interval.start, interval.end)) {
                fields.forEach((field, fieldIndex) => {
                    const colIndex = fieldIndex + 2; // +2 pour tenir compte de la colonne des horaires
                    const cell = poolCalendarSheet.getCell(interval.rowNumber, colIndex);
                    cell.value = transition.label;
                    cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: transition.color },
                    };
                });
            }
        });
    });

    // Appliquer les bordures aux cellules
    poolCalendarSheet.eachRow(row => {
        row.eachCell(cell => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
        });
    });
}


/**
 * Fonction principale pour générer le fichier Excel.
 * @param {Object} data - Les données du tournoi.
 * @param {number|string} tourneyId - L'ID du tournoi.
 * @returns {string} - Le chemin du fichier Excel généré.
 */
async function generateExcelFile(data, tourneyId) {
    const workbook = new ExcelJS.Workbook();

    // Feuille 1: Génération de la feuille des pools
    generatePoolCalendarSheet(workbook, data);
    // Feuille 2: Génération de la feuille calendrier
    generateCalendarSheet(workbook, data);

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

    // Feuille 4: Utilisateurs
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

    // Feuille 5: Planning des Pools
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

    // Feuille 6: Planning des Matchs
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

    // Génération des feuilles pour chaque terrain
    const fields = [...new Set(data.games.map(game => game.field.name))]; // Liste unique des terrains

    for (const fieldName of fields) {
        const fieldSheet = workbook.addWorksheet(`${fieldName}`);
        fieldSheet.columns = [
            { header: "Heure de début", key: "start", width: 15 },
            { header: "Heure de fin", key: "end", width: 15 },
            { header: "Pool", key: "pool", width: 15 },
            { header: "Équipe A", key: "teamA", width: 25 },
            { header: "Équipe B", key: "teamB", width: 25 },
            { header: "Score Équipe A", key: "scoreA", width: 15 },
            { header: "Score Équipe B", key: "scoreB", width: 15 },
            { header: "Sport", key: "sport", width: 20 },
        ];

        // Filtrer les matchs pour ce terrain et trier par heure de début
        const gamesForField = data.games
            .filter(game => game.field.name === fieldName)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        gamesForField.forEach(game => {
            fieldSheet.addRow({
                start: game.startTime
                    ? new Date(`${game.startTime}`).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : "Non défini",
                end: game.endTime
                    ? new Date(`${game.endTime}`).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })
                    : "Non défini",
                pool: game.pool?.name || "N/A",
                teamA: game.teamA?.teamName || "N/A",
                teamB: game.teamB?.teamName || "N/A",
                scoreA: game.scoreTeamA || "",
                scoreB: game.scoreTeamB || "",
                sport: game.sport?.name || "N/A",
            });
        });

        // Ajuster les styles si nécessaire
        fieldSheet.getRow(1).font = { bold: true };
        fieldSheet.getRow(1).alignment = { horizontal: 'center' };
        fieldSheet.columns.forEach(column => {
            column.alignment = { vertical: 'middle', horizontal: 'center' };
        });
    }

    // Sauvegarde du fichier
    const filePath = path.resolve(__dirname, `../exports/tournament_${tourneyId}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
}

module.exports = generateExcelFile;
