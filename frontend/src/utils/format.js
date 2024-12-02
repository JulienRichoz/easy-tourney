/**
 * Extrait le numéro de l'équipe à partir du nom de l'équipe.
 * Si le numéro n'est pas trouvable, retourne un fallback.
 * 
 * @param {string} teamName - Le nom de l'équipe (par exemple "Team 40").
 * @param {string|number} fallback - La valeur de retour par défaut si aucun numéro n'est trouvé.
 * @returns {string|number} Le numéro extrait ou le fallback.
 */
export function extractTeamNumber(teamName, fallback = 'Unknown') {
    if (!teamName || typeof teamName !== 'string') {
        return fallback;
    }

    const parts = teamName.split(' ');
    return parts.length > 1 && !isNaN(parts[1]) ? parts[1] : fallback;
}
