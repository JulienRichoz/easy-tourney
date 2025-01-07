// utils/dateUtils.js

/**
 * Calcule la différence en minutes entre deux heures au format "HH:MM:SS".
 * @param {string} startTime - Heure de début au format "HH:MM:SS".
 * @param {string} endTime - Heure de fin au format "HH:MM:SS".
 * @returns {number} - Différence en minutes.
 */
function timeDifferenceInMinutes(startTime, endTime) {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    return endMinutes - startMinutes;
}

/**
 * Convertit une chaîne de caractères représentant une heure en minutes.
 * @param {string} timeStr - Heure au format "HH:MM:SS" ou "HH:MM".
 * @returns {number} - Heure en minutes.
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Ajoute un nombre de minutes à une heure donnée.
 * @param {string} timeStr - Heure au format "HH:MM:SS" ou "HH:MM".
 * @param {number} minutesToAdd - Minutes à ajouter.
 * @returns {string} - Nouvelle heure au format "HH:MM:SS".
 */
function addMinutesToTime(timeStr, minutesToAdd) {
    const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:00`;
}

/**
 * Combine une date et une heure en un objet Date.
 * @param {string} dateStr - Date au format "YYYY-MM-DD".
 * @param {string} timeStr - Heure au format "HH:MM:SS" ou "HH:MM".
 * @returns {Date} - Un objet Date combiné.
 */
function combineDateAndTime(dateStr, timeStr) {
    // Assure que le format de timeStr est "HH:MM:SS"
    const normalizedTimeStr = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return new Date(`${dateStr}T${normalizedTimeStr}`); // 'Z' force UTC si on l'ajoute
}

/**
 * Convertit un nombre total de minutes en une chaîne de caractères représentant l'heure au format "HH:MM:SS".
 * @param {number} totalMinutes - Nombre total de minutes.
 * @returns {string} - Heure au format "HH:MM:SS".
 */
function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:00`;
}

/**
 * Formate une chaîne de caractères représentant une heure au format "HH:MM" en "HHhMM".
 * @param {string} timeStr - Heure au format "HH:MM".
 * @returns {string} - Heure formatée en "HHhMM".
 */
function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    return `${hours}h${minutes}`;
}

module.exports = {
    timeDifferenceInMinutes,
    timeToMinutes,
    addMinutesToTime,
    combineDateAndTime,
    minutesToTime,
    formatTime,
};