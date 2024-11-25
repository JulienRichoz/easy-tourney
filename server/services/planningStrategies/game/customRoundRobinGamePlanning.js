// server/services/planningStrategies/game/customRoundRobinGamePlanning.js

/**
 * Custom Round Robin Balanced Game Strategy
 *
 * Ce module implémente une stratégie de génération de matchs pour un tournoi en utilisant un algorithme
 * de round-robin équilibré. L'objectif est de planifier les matchs de manière à ce que :
 * - Chaque équipe joue le même nombre de matchs (ou avec une différence maximale d'un match).
 * - Le nombre de confrontations entre chaque paire d'équipes soit équilibré.
 * - Les équipes évitent de jouer deux matchs consécutifs, sauf si c'est inévitable.
 * - Tous les créneaux horaires disponibles soient remplis.
 *
 * Algorithme :
 * 1. Calculer le nombre total de matchs possibles en fonction du temps disponible et de la durée des matchs.
 * 2. Déterminer le nombre idéal de matchs par équipe pour assurer l'équité.
 * 3. Générer toutes les combinaisons possibles de matchs entre les équipes.
 * 4. Planifier les matchs en respectant les contraintes d'équilibrage et de repos.
 *
 * Formules utilisées :
 * - totalMatchesPossible = floor(totalAvailableTime / totalMatchTime)
 * - matchesPerTeam = floor((totalMatchesPossible * 2) / totalTeams)
 * - totalMatchesBetweenTeams = floor((totalMatchesPossible * 2) / (totalTeams * (totalTeams - 1)))
 *
 * Contraintes :
 * - Chaque équipe ne doit pas dépasser le nombre maximal de matchs (matchesPerTeam).
 * - Chaque paire d'équipes ne doit pas dépasser le nombre maximal de confrontations (totalMatchesBetweenTeams).
 * - Éviter que les équipes jouent deux matchs consécutifs.
 *
 * Difficultés rencontrées :
 * - Assurer l'équilibre parfait des matchs par équipe et des confrontations entre paires d'équipes.
 * - Gérer les pools avec un nombre impair d'équipes.
 * - Remplir tous les créneaux horaires tout en respectant les contraintes.
 */

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

const {
    timeDifferenceInMinutes,
    addMinutesToTime,
    combineDateAndTime,
} = require('../../../utils/dateUtils');

class CustomRoundRobinGamePlanning extends GameStrategy {
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

        // Calculer le nombre total de matchs disponibles dans les créneaux horaires
        let totalAvailableTime = 0;
        for (const poolSchedule of poolSchedules) {
            totalAvailableTime += timeDifferenceInMinutes(
                poolSchedule.startTime,
                poolSchedule.endTime
            );
        }

        const matchDuration = scheduleTourney.gameDuration; // en minutes
        const transitionTime = scheduleTourney.transitionGameTime; // en minutes
        const totalMatchTime = matchDuration + transitionTime;

        // Nombre total de matchs possibles
        const totalMatchesPossible = Math.floor(totalAvailableTime / totalMatchTime);

        // Calculer le nombre idéal de matchs par équipe
        const totalTeams = teams.length;
        const totalTeamAppearances = totalMatchesPossible * 2; // Chaque match implique 2 équipes
        const matchesPerTeam = Math.floor(totalTeamAppearances / totalTeams);

        // Calculer le nombre maximal de confrontations entre paires d'équipes
        const totalPossiblePairings = (totalTeams * (totalTeams - 1)) / 2;
        const totalMatchesBetweenTeams = Math.floor(
            (matchesPerTeam * totalTeams) / totalPossiblePairings
        );

        // Initialiser les compteurs de matchs par équipe
        const teamTotalMatchCounts = new Map();
        teams.forEach((team) => {
            teamTotalMatchCounts.set(team.id, 0);
        });

        // Générer toutes les combinaisons possibles de matchs entre les équipes
        const allPossibleMatchups = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                const teamA = teams[i];
                const teamB = teams[j];
                const key = this.getMatchKey(teamA.id, teamB.id);
                allPossibleMatchups.push({ teamA, teamB, key, matchCount: 0 });
            }
        }

        // Planifier les matchs dans les créneaux horaires disponibles
        const matchesScheduled = [];
        let globalRound = 0; // Compteur global pour suivre les tours

        for (const poolSchedule of poolSchedules) {
            await this.generateMatchesForPoolSchedule(
                pool,
                teams,
                poolSchedule,
                allPossibleMatchups,
                teamTotalMatchCounts,
                scheduleTourney,
                matchesScheduled,
                tourney,
                globalRound,
                matchesPerTeam,
                totalMatchesBetweenTeams
            );

            // Mettre à jour le compteur global en fonction du nombre de matchs planifiés dans ce créneau
            const slotAvailableTime = timeDifferenceInMinutes(
                poolSchedule.startTime,
                poolSchedule.endTime
            );
            const numMatchesInSlot = Math.floor(slotAvailableTime / totalMatchTime);
            globalRound += numMatchesInSlot;
        }

        if (!pool || !pool.id) {
            throw new Error('Pool invalide lors de la génération du match.');
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
     * @param {Array} allPossibleMatchups - Toutes les combinaisons de matchs possibles.
     * @param {Map} teamTotalMatchCounts - Compteur total de matchs par équipe.
     * @param {Object} scheduleTourney - La configuration du planning.
     * @param {Array} matchesScheduled - Liste des matchs déjà planifiés.
     * @param {Object} tourney - Le tournoi en cours.
     * @param {number} globalRound - Compteur global des matchs planifiés.
     * @param {number} matchesPerTeam - Nombre maximal de matchs par équipe.
     * @param {number} totalMatchesBetweenTeams - Nombre maximal de confrontations entre paires d'équipes.
     */
    async generateMatchesForPoolSchedule(
        pool,
        teams,
        poolSchedule,
        allPossibleMatchups,
        teamTotalMatchCounts,
        scheduleTourney,
        matchesScheduled,
        tourney,
        globalRound,
        matchesPerTeam,
        totalMatchesBetweenTeams
    ) {
        // Calculer le nombre de matchs possibles dans ce créneau
        const matchDuration = scheduleTourney.gameDuration; // en minutes
        const transitionTime = scheduleTourney.transitionGameTime; // en minutes

        const totalAvailableTime = timeDifferenceInMinutes(
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

        // Initialiser les équipes ayant joué le dernier match
        let lastTeamsPlayed = new Set();

        // Planifier les matchs dans le créneau horaire
        for (let m = 0; m < numMatchesInSlot; m++) {
            // Générer une liste des matchs possibles en excluant les équipes ayant atteint le maximum de matchs
            const availableMatchups = allPossibleMatchups.filter(
                ({ teamA, teamB, matchCount }) =>
                    teamTotalMatchCounts.get(teamA.id) < matchesPerTeam &&
                    teamTotalMatchCounts.get(teamB.id) < matchesPerTeam &&
                    matchCount < totalMatchesBetweenTeams
            );

            if (availableMatchups.length === 0) {
                // Toutes les équipes ont atteint le nombre maximal de matchs
                break;
            }

            // Trier les matchs possibles en priorisant les paires avec le moins de confrontations
            availableMatchups.sort((a, b) => {
                if (a.matchCount !== b.matchCount) {
                    return a.matchCount - b.matchCount;
                } else {
                    // Si égalité, prioriser les équipes ayant joué le moins de matchs au total
                    const aTotal =
                        teamTotalMatchCounts.get(a.teamA.id) +
                        teamTotalMatchCounts.get(a.teamB.id);
                    const bTotal =
                        teamTotalMatchCounts.get(b.teamA.id) +
                        teamTotalMatchCounts.get(b.teamB.id);
                    return aTotal - bTotal
                }
            });



            let matchScheduled = false;
            for (const matchup of availableMatchups) {
                const { teamA, teamB } = matchup;

                // Vérifier si les équipes ne jouent pas déjà dans le dernier match
                if (
                    !lastTeamsPlayed.has(teamA.id) &&
                    !lastTeamsPlayed.has(teamB.id)
                ) {
                    // Planifier le match
                    matchesScheduled.push({
                        teamA,
                        teamB,
                        poolScheduleId: poolSchedule.id,
                        fieldId: poolSchedule.fieldId,
                        sportId: poolSchedule.sportId,
                        startTime: combineDateAndTime(matchDate, matchStartTime),
                        endTime: combineDateAndTime(
                            matchDate,
                            addMinutesToTime(matchStartTime, matchDuration)
                        ),
                    });

                    // Mettre à jour les compteurs
                    matchup.matchCount += 1;
                    teamTotalMatchCounts.set(
                        teamA.id,
                        teamTotalMatchCounts.get(teamA.id) + 1
                    );
                    teamTotalMatchCounts.set(
                        teamB.id,
                        teamTotalMatchCounts.get(teamB.id) + 1
                    );

                    // Mettre à jour les équipes ayant joué le dernier match
                    lastTeamsPlayed = new Set([teamA.id, teamB.id]);

                    // Mettre à jour l'heure de début pour le prochain match
                    matchStartTime = addMinutesToTime(
                        addMinutesToTime(matchStartTime, matchDuration),
                        transitionTime
                    );

                    // Incrémenter le compteur global des matchs planifiés
                    globalRound++;

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
}

module.exports = CustomRoundRobinGamePlanning;
