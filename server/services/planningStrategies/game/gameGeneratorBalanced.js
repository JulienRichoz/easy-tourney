// server/services/planningStrategies/game/customRoundRobinBalancedGameStrategy.js

const GameStrategy = require('./gameStrategy');
const {
    Game,
    Team,
    Pool,
    PoolSchedule,
    Field,
    Sport,
    Tourney,
    ScheduleTourney,
} = require('../../../models');

class CustomRoundRobinBalancedGameStrategy extends GameStrategy {
    constructor(tourneyId) {
        super(tourneyId);
    }

    /**
     * Génère les matchs pour le tournoi en cours.
     */
    async generateGames() {
        // Supprimer les matchs existants pour éviter les doublons
        await Game.destroy({ where: { tourneyId: this.tourneyId } });

        // Récupérer le tournoi
        const tourney = await Tourney.findByPk(this.tourneyId);
        if (!tourney) {
            throw new Error('Tournoi introuvable.');
        }

        // Récupérer la configuration du planning
        const scheduleTourney = await ScheduleTourney.findOne({
            where: { tourneyId: this.tourneyId },
        });
        if (!scheduleTourney) {
            throw new Error(
                'Aucune configuration de planning trouvée pour ce tournoi.'
            );
        }

        // Récupérer les pools avec leurs équipes et leurs plannings
        const pools = await Pool.findAll({
            where: { tourneyId: this.tourneyId },
            include: [
                {
                    model: Team,
                    as: 'teams',
                    attributes: ['id', 'teamName'],
                },
                {
                    model: PoolSchedule,
                    as: 'schedules',
                    include: [
                        {
                            model: Field,
                            as: 'field',
                            attributes: ['id', 'name'],
                        },
                        {
                            model: Sport,
                            as: 'sport',
                            attributes: ['id', 'name'],
                        },
                    ],
                    attributes: [
                        'id',
                        'fieldId',
                        'startTime',
                        'endTime',
                        'date',
                        'sportId',
                    ],
                },
            ],
        });

        if (!pools.length) {
            throw new Error('Aucune pool disponible pour générer les matchs.');
        }

        // Générer les matchs pour chaque pool
        for (const pool of pools) {
            await this.generateGamesForPool(pool, scheduleTourney, tourney);
        }

        return { message: 'Matchs générés avec succès.' };
    }

    /**
     * Génère les matchs pour une pool spécifique.
     * @param {Object} pool - La pool pour laquelle générer les matchs.
     * @param {Object} scheduleTourney - La configuration du planning.
     * @param {Object} tourney - Le tournoi en cours.
     */
    async generateGamesForPool(pool, scheduleTourney, tourney) {
        const teams = pool.teams;
        const poolSchedules = pool.schedules;

        if (teams.length < 2 || poolSchedules.length === 0) {
            // Impossible de générer des matchs
            return;
        }

        // Générer toutes les combinaisons possibles de matchs entre les équipes
        const allPossibleMatches = [];
        const matchCounts = new Map(); // Compte le nombre de matchs entre chaque paire d'équipes

        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];
                const key = this.getMatchKey(teamA.id, teamB.id);
                matchCounts.set(key, 0);
                allPossibleMatches.push({ teamA, teamB, key });
            }
        }

        // Initialiser le compteur de matchs pour chaque équipe
        const teamTotalMatchCounts = new Map();
        teams.forEach((team) => {
            teamTotalMatchCounts.set(team.id, 0);
        });

        // Planifier les matchs dans les créneaux horaires disponibles
        const matchesScheduled = [];

        for (const poolSchedule of poolSchedules) {
            await this.generateMatchesForPoolSchedule(
                pool,
                teams,
                poolSchedule,
                allPossibleMatches,
                matchCounts,
                teamTotalMatchCounts,
                scheduleTourney,
                matchesScheduled,
                tourney
            );
        }

        // Enregistrer les matchs planifiés dans la base de données
        for (const match of matchesScheduled) {
            await Game.create({
                tourneyId: this.tourneyId,
                poolId: pool.id,
                poolScheduleId: match.poolScheduleId,
                teamAId: match.teamA.id,
                teamBId: match.teamB.id,
                fieldId: match.fieldId,
                sportId: match.sportId,
                startTime: match.startTime,
                endTime: match.endTime,
                status: 'scheduled',
            });
        }
    }

    /**
     * Génère les matchs pour un créneau horaire spécifique d'une pool.
     * @param {Object} pool - La pool concernée.
     * @param {Array} teams - Les équipes de la pool.
     * @param {Object} poolSchedule - Le créneau horaire de la pool.
     * @param {Array} allPossibleMatches - Toutes les combinaisons de matchs possibles.
     * @param {Map} matchCounts - Compteur de matchs par paire d'équipes.
     * @param {Map} teamTotalMatchCounts - Compteur total de matchs par équipe.
     * @param {Object} scheduleTourney - La configuration du planning.
     * @param {Array} matchesScheduled - Liste des matchs déjà planifiés.
     * @param {Object} tourney - Le tournoi en cours.
     */
    async generateMatchesForPoolSchedule(
        pool,
        teams,
        poolSchedule,
        allPossibleMatches,
        matchCounts,
        teamTotalMatchCounts,
        scheduleTourney,
        matchesScheduled,
        tourney
    ) {
        // Calculer le nombre de matchs possibles dans ce créneau
        const matchDuration = scheduleTourney.gameDuration; // en minutes
        const transitionTime = scheduleTourney.transitionGameTime; // en minutes

        const totalAvailableTime = this.timeDifferenceInMinutes(
            poolSchedule.startTime,
            poolSchedule.endTime
        );

        const totalMatchTime = matchDuration + transitionTime;

        const numMatchesInSlot = Math.floor(totalAvailableTime / totalMatchTime);

        if (numMatchesInSlot <= 0) {
            // Pas de temps disponible pour planifier des matchs
            return;
        }

        let matchStartTime = poolSchedule.startTime;

        // Déterminer la date du match
        const matchDate = poolSchedule.date || tourney.dateTourney;

        // Suivre les équipes déjà planifiées dans ce créneau pour éviter les doublons
        const teamsPlayingInSlot = new Set();

        // Planifier les matchs dans le créneau horaire
        for (let m = 0; m < numMatchesInSlot && allPossibleMatches.length > 0;) {
            // Trier les matchs possibles en priorisant les paires avec le moins de confrontations
            allPossibleMatches.sort((a, b) => {
                const aCount = matchCounts.get(a.key);
                const bCount = matchCounts.get(b.key);

                if (aCount !== bCount) {
                    return aCount - bCount;
                } else {
                    // Si égalité, prioriser les équipes ayant joué le moins de matchs au total
                    const aTotal =
                        teamTotalMatchCounts.get(a.teamA.id) +
                        teamTotalMatchCounts.get(a.teamB.id);
                    const bTotal =
                        teamTotalMatchCounts.get(b.teamA.id) +
                        teamTotalMatchCounts.get(b.teamB.id);
                    return aTotal - bTotal;
                }
            });

            let matchScheduled = false;
            for (let i = 0; i < allPossibleMatches.length; i++) {
                const matchup = allPossibleMatches[i];
                const { teamA, teamB, key } = matchup;

                // Vérifier si les équipes ne jouent pas déjà dans ce créneau
                if (
                    !teamsPlayingInSlot.has(teamA.id) &&
                    !teamsPlayingInSlot.has(teamB.id)
                ) {
                    // Planifier le match
                    matchesScheduled.push({
                        teamA,
                        teamB,
                        poolScheduleId: poolSchedule.id,
                        fieldId: poolSchedule.fieldId,
                        sportId: poolSchedule.sportId,
                        startTime: this.combineDateAndTime(matchDate, matchStartTime),
                        endTime: this.combineDateAndTime(
                            matchDate,
                            this.addMinutesToTime(matchStartTime, matchDuration)
                        ),
                    });

                    // Mettre à jour les compteurs
                    matchCounts.set(key, matchCounts.get(key) + 1);
                    teamTotalMatchCounts.set(
                        teamA.id,
                        teamTotalMatchCounts.get(teamA.id) + 1
                    );
                    teamTotalMatchCounts.set(
                        teamB.id,
                        teamTotalMatchCounts.get(teamB.id) + 1
                    );

                    // Retirer le match de la liste s'il a atteint le nombre maximal de confrontations
                    // (par exemple, si on veut limiter le nombre de fois que deux équipes s'affrontent)
                    // Ici, on le retire une fois planifié pour éviter les doublons
                    allPossibleMatches.splice(i, 1);

                    // Ajouter les équipes à l'ensemble des équipes jouant dans ce créneau
                    teamsPlayingInSlot.add(teamA.id);
                    teamsPlayingInSlot.add(teamB.id);

                    // Mettre à jour l'heure de début pour le prochain match
                    matchStartTime = this.addMinutesToTime(
                        this.addMinutesToTime(matchStartTime, matchDuration),
                        transitionTime
                    );

                    // Incrémenter le compteur de matchs planifiés
                    m++;

                    matchScheduled = true;

                    // Passer au prochain match
                    break;
                }
            }

            if (!matchScheduled) {
                // Aucun match supplémentaire ne peut être planifié dans ce créneau
                break;
            }
        }
    }

    /**
     * Génère une clé unique pour une paire d'équipes.
     * @param {number} teamAId - ID de l'équipe A.
     * @param {number} teamBId - ID de l'équipe B.
     * @returns {string} - Clé unique pour la paire d'équipes.
     */
    getMatchKey(teamAId, teamBId) {
        return [teamAId, teamBId].sort().join('-');
    }

    // Les autres méthodes restent les mêmes (timeDifferenceInMinutes, timeToMinutes, etc.)

    /**
     * Calcule la différence en minutes entre deux heures.
     * @param {string} startTime - Heure de début au format "HH:MM:SS".
     * @param {string} endTime - Heure de fin au format "HH:MM:SS".
     * @returns {number} - Différence en minutes.
     */
    timeDifferenceInMinutes(startTime, endTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = this.timeToMinutes(endTime);
        return endMinutes - startMinutes;
    }

    /**
     * Convertit une heure au format "HH:MM:SS" en minutes.
     * @param {string} timeStr - Heure au format "HH:MM:SS".
     * @returns {number} - Heure en minutes.
     */
    timeToMinutes(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Ajoute des minutes à une heure donnée.
     * @param {string} timeStr - Heure au format "HH:MM:SS".
     * @param {number} minutesToAdd - Minutes à ajouter.
     * @returns {string} - Nouvelle heure au format "HH:MM:SS".
     */
    addMinutesToTime(timeStr, minutesToAdd) {
        const totalMinutes = this.timeToMinutes(timeStr) + minutesToAdd;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:00`;
    }

    /**
     * Combine une date et une heure en un objet Date.
     * @param {string} dateStr - Date au format "YYYY-MM-DD".
     * @param {string} timeStr - Heure au format "HH:MM:SS".
     * @returns {Date} - Un objet Date combiné.
     */
    combineDateAndTime(dateStr, timeStr) {
        return new Date(`${dateStr}T${timeStr}`);
    }
}

module.exports = CustomRoundRobinBalancedGameStrategy;
