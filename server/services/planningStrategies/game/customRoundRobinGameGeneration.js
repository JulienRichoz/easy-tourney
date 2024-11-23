// services/gameStrategies/customRoundRobinGameGeneration.js

const GameStrategy = require('./gameStrategy');
const {
    Pool,
    PoolSchedule,
    Team,
    Game,
    ScheduleTourney,
} = require('../../models');
const { Op } = require('sequelize');
const moment = require('moment');

class CustomRoundRobinGameGeneration extends GameStrategy {
    constructor(tourneyId, options = {}) {
        super(tourneyId);
        this.options = options;
    }

    /**
     * Génère les matchs pour le tournoi 'customRoundRobin'
     */
    async generateGames() {
        // 1. Récupérer les données nécessaires
        const tourneyId = this.tourneyId;

        // Récupérer les pools avec leurs équipes
        const pools = await Pool.findAll({
            where: { tourneyId },
            include: [{ model: Team, as: 'teams' }],
        });

        // Récupérer les PoolSchedules
        const poolSchedules = await PoolSchedule.findAll({
            where: { poolId: { [Op.in]: pools.map((pool) => pool.id) } },
        });

        // Récupérer la configuration du tournoi
        const scheduleTourney = await ScheduleTourney.findOne({
            where: { tourneyId },
        });

        if (!scheduleTourney) {
            throw new Error("La configuration du tournoi n'est pas disponible.");
        }

        const gameDuration = scheduleTourney.gameDuration; // en minutes
        const transitionGameTime = scheduleTourney.transitionGameTime; // en minutes

        // 2. Pour chaque PoolSchedule, générer les matchs
        for (const poolSchedule of poolSchedules) {
            const pool = pools.find((p) => p.id === poolSchedule.poolId);
            const teams = pool.teams;

            if (teams.length < 2) {
                // Pas assez d'équipes pour créer des matchs
                continue;
            }

            // Générer les paires de matchs
            const matches = this.generateTeamPairs(teams);

            // Calculer le nombre de créneaux disponibles
            const sessionStart = moment(`${poolSchedule.date} ${poolSchedule.startTime}`, 'YYYY-MM-DD HH:mm:ss');
            const sessionEnd = moment(`${poolSchedule.date} ${poolSchedule.endTime}`, 'YYYY-MM-DD HH:mm:ss');
            const sessionDuration = sessionEnd.diff(sessionStart, 'minutes');

            const matchSlotDuration = gameDuration + transitionGameTime;
            const maxMatchSlots = Math.floor(sessionDuration / matchSlotDuration);

            // Limiter le nombre de matchs à planifier
            const matchesToSchedule = matches.slice(0, maxMatchSlots);

            // Planifier les matchs en respectant les contraintes
            const scheduledGames = this.scheduleMatches(
                matchesToSchedule,
                sessionStart,
                matchSlotDuration,
                poolSchedule,
                gameDuration
            );

            // Sauvegarder les matchs dans la base de données
            for (const gameData of scheduledGames) {
                await Game.create(gameData);
            }
        }

        return { message: 'Génération des matchs terminée avec succès.' };
    }

    /**
     * Génère toutes les paires uniques d'équipes au sein d'une pool
     * @param {Array} teams - Liste des équipes
     * @returns {Array} - Liste des paires [teamA, teamB]
     */
    generateTeamPairs(teams) {
        const matches = [];
        for (let i = 0; i < teams.length; i++) {
            for (let j = i + 1; j < teams.length; j++) {
                matches.push([teams[i], teams[j]]);
            }
        }
        return matches;
    }

    /**
     * Planifie les matchs en évitant que les équipes jouent deux fois de suite
     * @param {Array} matches - Liste des paires [teamA, teamB]
     * @param {moment} sessionStart - Heure de début de la session
     * @param {number} matchSlotDuration - Durée d'un créneau de match (en minutes)
     * @param {Object} poolSchedule - Objet PoolSchedule
     * @param {number} gameDuration - Durée d'un match (en minutes)
     * @returns {Array} - Liste des données de matchs à créer
     */
    scheduleMatches(matches, sessionStart, matchSlotDuration, poolSchedule, gameDuration) {
        const scheduledGames = [];
        const teamLastPlayedAt = {}; // Clé : teamId, Valeur : index du créneau où l'équipe a joué

        for (let slotIndex = 0; slotIndex < matches.length; slotIndex++) {
            const [teamA, teamB] = matches[slotIndex];

            // Vérifier si les équipes ont joué au créneau précédent
            const teamAPlayedAt = teamLastPlayedAt[teamA.id];
            const teamBPlayedAt = teamLastPlayedAt[teamB.id];

            if (
                (teamAPlayedAt !== undefined && teamAPlayedAt === slotIndex - 1) ||
                (teamBPlayedAt !== undefined && teamBPlayedAt === slotIndex - 1)
            ) {
                // Trouver un autre match pour cet horaire
                let swapped = false;
                for (let k = slotIndex + 1; k < matches.length; k++) {
                    const [otherTeamA, otherTeamB] = matches[k];
                    const otherTeamAPlayedAt = teamLastPlayedAt[otherTeamA.id];
                    const otherTeamBPlayedAt = teamLastPlayedAt[otherTeamB.id];

                    if (
                        (otherTeamAPlayedAt === undefined || otherTeamAPlayedAt < slotIndex - 1) &&
                        (otherTeamBPlayedAt === undefined || otherTeamBPlayedAt < slotIndex - 1)
                    ) {
                        // Échanger les matchs
                        [matches[slotIndex], matches[k]] = [matches[k], matches[slotIndex]];
                        swapped = true;
                        break;
                    }
                }

                if (!swapped) {
                    // Impossible d'éviter qu'une équipe joue deux fois de suite
                    // Cela peut arriver pour les pools avec peu d'équipes
                }
            }

            // Planifier le match
            const matchStartTime = sessionStart.clone().add(slotIndex * matchSlotDuration, 'minutes');
            const matchEndTime = matchStartTime.clone().add(gameDuration, 'minutes');

            scheduledGames.push({
                tourneyId: this.tourneyId,
                poolId: poolSchedule.poolId,
                poolScheduleId: poolSchedule.id,
                teamAId: matches[slotIndex][0].id,
                teamBId: matches[slotIndex][1].id,
                fieldId: poolSchedule.fieldId,
                sportId: poolSchedule.sportId,
                startTime: matchStartTime.toDate(),
                endTime: matchEndTime.toDate(),
                status: 'scheduled',
            });

            // Mettre à jour le dernier créneau joué pour les équipes
            teamLastPlayedAt[matches[slotIndex][0].id] = slotIndex;
            teamLastPlayedAt[matches[slotIndex][1].id] = slotIndex;
        }

        return scheduledGames;
    }

    /**
     * Valide les matchs générés
     */
    async validateGames() {
        // Implémenter la logique de validation si nécessaire
        return { message: 'Validation des matchs non implémentée.' };
    }
}

module.exports = CustomRoundRobinGameGeneration;
