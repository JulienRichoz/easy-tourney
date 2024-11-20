/**
 * ========================================================================
 * CustomRoundRobinPlanning - Générateur de planning personnalisé en Round Robin
 * ========================================================================
 *
 * Description :
 * -------------
 * Ce module génère un planning pour des pools (groupes d'équipes) dans le cadre d'un tournoi,
 * en assignant des sessions de jeux sur différents terrains et sports disponibles.
 *
 * L'objectif est de :
 * - Assigner chaque pool à des créneaux horaires en évitant les conflits.
 * - Assurer que chaque pool participe au même nombre de sessions.
 * - Maximiser la diversité des sports joués par chaque pool.
 * - Équilibrer les assignations pour que les pools ne jouent pas trop souvent le même sport.
 *
 * Fonctionnement :
 * ----------------
 * 1. **Récupération des données** : Chargement des pools, terrains, configurations, etc.
 * 2. **Génération des créneaux horaires** : Calcul des créneaux disponibles en fonction des
 *    intervalles de temps et des pauses (introduction, déjeuner, conclusion).
 * 3. **Initialisation des structures de données** : Préparation des variables nécessaires pour
 *    le suivi des assignations.
 * 4. **Assignation initiale des pools** : Assignation des pools aux créneaux horaires en
 *    priorisant les pools avec le moins d'assignations totales.
 * 5. **Équilibrage des sessions** : Vérification des pools ayant moins de sessions que le
 *    maximum et assignation de sessions supplémentaires en favorisant les sports les moins joués.
 * 6. **Gestion des contraintes** : Évitement des conflits d'horaires, respect des disponibilités
 *    des terrains et des pools, maintien de la diversité des sports.
 *
 * Complexité :
 * ------------
 * - **Temps** :
 *   - La complexité globale est principalement déterminée par les boucles imbriquées sur les
 *     créneaux horaires, les terrains, et les pools.
 *   - Si `n` est le nombre de pools, `t` le nombre de créneaux horaires, et `f` le nombre de
 *     terrains, la complexité est approximativement O(t * f * n).
 * - **Espace** :
 *   - L'algorithme utilise des structures de données proportionnelles au nombre de pools,
 *     de créneaux horaires, et de terrains.
 *
 * Contraintes et Points à Considérer :
 * ------------------------------------
 * - **Disponibilité des Terrains** : Les terrains peuvent avoir des plages horaires différentes.
 * - **Pauses Globales** : Les périodes d'introduction, de déjeuner et de conclusion doivent être
 *   respectées et aucun match ne doit être programmé pendant ces pauses.
 * - **Équité entre les Pools** : Chaque pool doit participer au même nombre de sessions, même si
 *   cela implique de jouer certains sports plus d'une fois.
 * - **Diversité des Sports** : L'algorithme tente de maximiser la diversité des sports joués par
 *   chaque pool, en évitant de jouer trop souvent le même sport.
 * - **Conflits d'Horaires** : Une pool ne peut pas être assignée à plusieurs sessions en même temps.
 * - **Disponibilité des Pools** : Les pools doivent être disponibles pour les créneaux horaires
 *   assignés, en tenant compte des sessions déjà planifiées.
 *
 * ========================================================================
 */
const PlanningStrategy = require('./planningStrategy');
const { Pool, PoolSchedule, Field, ScheduleTourney, SportsFields, Sport, Tourney } = require('../../../models');

class CustomRoundRobinPlanning extends PlanningStrategy {
  async generatePlanning() {
    // === 1. Récupération des données ===
    // Récupérer le tournoi
    const tourney = await Tourney.findOne({ where: { id: this.tourneyId } });
    if (!tourney) {
      throw new Error('Tournoi introuvable.');
    }

    const tourneyDate = tourney.dateTourney;

    // Récupérer les pools du tournoi
    const pools = await Pool.findAll({ where: { tourneyId: this.tourneyId } });
    if (pools.length === 0) {
      throw new Error("Aucune pool disponible pour générer le planning.");
    }

    // Récupérer les terrains et leurs disponibilités
    const fields = await Field.findAll({
      where: { tourneyId: this.tourneyId },
      include: {
        model: SportsFields,
        as: 'sportsFields',
        include: {
          model: Sport,
          as: 'sport',
          attributes: ['id', 'name'],
        },
        attributes: ['startTime', 'endTime', 'sportId'],
      },
    });
    if (fields.length === 0) {
      throw new Error("Aucun terrain disponible pour ce tournoi.");
    }

    // Récupérer la configuration du planning
    const scheduleTourney = await ScheduleTourney.findOne({
      where: { tourneyId: this.tourneyId },
    });
    if (!scheduleTourney) {
      throw new Error("Aucune configuration de planning trouvée pour ce tournoi.");
    }

    // === 2. Génération des créneaux horaires ===

    // Variables pour la planification
    const {
      startTime,
      endTime,
      poolDuration,
      transitionPoolTime,
      introStart,
      introEnd,
      lunchStart,
      lunchEnd,
      outroStart,
      outroEnd,
    } = scheduleTourney;

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Convertir les pauses en minutes
    const breaks = [];
    const pauseLabels = [
      { start: introStart, end: introEnd, label: 'Introduction' },
      { start: lunchStart, end: lunchEnd, label: 'Déjeuner' },
      { start: outroStart, end: outroEnd, label: 'Conclusion' },
    ];

    for (const pause of pauseLabels) {
      if (pause.start && pause.end) {
        breaks.push({
          start: this.timeToMinutes(pause.start),
          end: this.timeToMinutes(pause.end),
          label: pause.label,
        });
      }
    }

    // Durée totale d'un créneau (pool + transition)
    const totalPoolTime = poolDuration + transitionPoolTime;

    // Collecter et fusionner les intervalles de disponibilité des terrains
    const availabilityIntervals = [];

    fields.forEach((field) => {
      field.sportsFields.forEach((sf) => {
        const fieldStartMinutes = this.timeToMinutes(sf.startTime);
        const fieldEndMinutes = this.timeToMinutes(sf.endTime);
        availabilityIntervals.push([fieldStartMinutes, fieldEndMinutes]);
      });
    });

    // Fonction pour fusionner les intervalles chevauchants
    function mergeIntervals(intervals) {
      if (!intervals.length) return [];

      intervals.sort((a, b) => a[0] - b[0]);

      const result = [intervals[0]];

      for (const interval of intervals.slice(1)) {
        const last = result[result.length - 1];

        if (interval[0] <= last[1]) {
          // Fusionner les intervalles qui se chevauchent
          last[1] = Math.max(last[1], interval[1]);
        } else {
          result.push(interval);
        }
      }

      return result;
    }

    const mergedAvailabilityIntervals = mergeIntervals(availabilityIntervals);

    // Fonction pour soustraire les pauses des intervalles de disponibilité
    function subtractBreaks(intervals, breaks) {
      const result = [];

      for (const [start, end] of intervals) {
        let tempIntervals = [[start, end]];

        for (const { start: breakStart, end: breakEnd } of breaks) {
          const newTempIntervals = [];

          for (const [s, e] of tempIntervals) {
            if (e <= breakStart || s >= breakEnd) {
              // Pas de chevauchement avec la pause
              newTempIntervals.push([s, e]);
            } else {
              // Chevauchement, on coupe l'intervalle
              if (s < breakStart) {
                newTempIntervals.push([s, breakStart]);
              }
              if (e > breakEnd) {
                newTempIntervals.push([breakEnd, e]);
              }
            }
          }

          tempIntervals = newTempIntervals;
        }

        result.push(...tempIntervals);
      }

      return result;
    }

    // Soustraire les pauses des intervalles de disponibilité
    const effectiveIntervals = subtractBreaks(mergedAvailabilityIntervals, breaks);

    // Générer les créneaux horaires en fonction des intervalles effectifs
    const planning = this.generateTimeSlots(effectiveIntervals, startMinutes, endMinutes, totalPoolTime);

    // === 3. Initialisation des structures de données ===

    // Supprimer les PoolSchedules existants
    await PoolSchedule.destroy({ where: { poolId: pools.map((p) => p.id) } });

    // Initialiser les structures de données pour le suivi
    this.initializeDataStructures(pools);

    // === 4. Assignation initiale des pools ===

    await this.initialAssignment(pools, planning, fields, tourneyDate, poolDuration);

    // === 5. Équilibrage des sessions ===

    await this.balancePoolSessions(pools, planning, fields, tourneyDate, poolDuration);

    return { message: 'Planning généré avec succès.' };
  }

  /**
   * Initialise les structures de données nécessaires pour le suivi des assignations.
   * @param {Array} pools - Liste des pools du tournoi.
   */
  initializeDataStructures(pools) {
    this.poolPlayedSports = new Map(); // Map<poolId, Map<sportId, count>>
    this.poolTotalAssignments = new Map(); // Map<poolId, totalAssignments>
    this.poolsAssignedAtTimeSlot = {}; // Map<timeSlot, Set<poolId>>
    this.fieldsAssignedAtTimeSlot = {}; // Map<timeSlot, Set<fieldId>>

    pools.forEach((pool) => {
      this.poolPlayedSports.set(pool.id, new Map());
      this.poolTotalAssignments.set(pool.id, 0);
    });
  }

  /**
   * Génère les créneaux horaires disponibles en fonction des intervalles effectifs.
   * @param {Array} effectiveIntervals - Intervalles de disponibilité après soustraction des pauses.
   * @param {number} startMinutes - Heure de début du planning en minutes.
   * @param {number} endMinutes - Heure de fin du planning en minutes.
   * @param {number} totalPoolTime - Durée totale d'un créneau (pool + transition) en minutes.
   * @returns {Array} - Liste des créneaux horaires en minutes.
   */
  generateTimeSlots(effectiveIntervals, startMinutes, endMinutes, totalPoolTime) {
    const planning = [];

    for (const [intervalStart, intervalEnd] of effectiveIntervals) {
      let currentTime = Math.max(intervalStart, startMinutes);

      while (
        currentTime + totalPoolTime <= intervalEnd &&
        currentTime + totalPoolTime <= endMinutes
      ) {
        planning.push(currentTime);
        currentTime += totalPoolTime;
      }
    }

    return planning;
  }

  /**
   * Réalise l'assignation initiale des pools aux créneaux horaires disponibles.
   * @param {Array} pools - Liste des pools.
   * @param {Array} planning - Liste des créneaux horaires.
   * @param {Array} fields - Liste des terrains disponibles.
   * @param {Object} scheduleTourney - Configuration du planning du tournoi.
   * @param {number} poolDuration - Durée d'une session de pool en minutes.
   */
  async initialAssignment(pools, planning, fields, tourneyDate, poolDuration) {
    // Copier la liste des pools
    let poolQueue = [...pools];

    // Boucler sur les créneaux horaires
    for (let i = 0; i < planning.length; i++) {
      let timeSlot = planning[i];

      // Faire une rotation de la file d'attente des pools
      if (i > 0) {
        // Décaler la première pool à la fin de la queue
        poolQueue.push(poolQueue.shift());
      }

      // Initialiser la liste des pools assignées à ce créneau
      this.poolsAssignedAtTimeSlot[timeSlot] = new Set();
      this.fieldsAssignedAtTimeSlot[timeSlot] = new Set();

      // Parcourir les pools disponibles
      for (const selectedPool of poolQueue) {
        // Vérifier si la pool est déjà assignée à ce créneau horaire
        if (this.poolsAssignedAtTimeSlot[timeSlot].has(selectedPool.id)) {
          continue; // Passer à la pool suivante
        }

        // Rechercher les sports disponibles à ce créneau
        const sportsAvailable = this.getSportsAvailableAtTimeSlot(timeSlot, fields, poolDuration);

        // Prioriser les sports les moins joués par la pool
        const sportsPlayed = this.poolPlayedSports.get(selectedPool.id);
        const possibleSports = Array.from(sportsAvailable.keys()).sort((a, b) => {
          const countA = sportsPlayed.get(a) || 0;
          const countB = sportsPlayed.get(b) || 0;
          return countA - countB;
        });

        let assigned = false;

        for (const sportId of possibleSports) {
          const fieldsAvailable = sportsAvailable.get(sportId);

          while (fieldsAvailable.length > 0) {
            const fieldAssignment = fieldsAvailable.shift();

            // Vérifier si le terrain est déjà assigné à ce créneau
            if (this.fieldsAssignedAtTimeSlot[timeSlot].has(fieldAssignment.field.id)) {
              continue; // Passer au terrain suivant
            }

            // Assigner la pool au terrain
            await this.assignPoolToTimeSlot(selectedPool.id, timeSlot, sportId, fieldAssignment, tourneyDate, poolDuration);

            assigned = true;
            break; // Sortir de la boucle des sports
          }

          if (assigned) {
            break; // Sortir de la boucle des sports
          }
        }
      }
    }
  }

  /**
   * Équilibre les sessions entre les pools en assignant des sessions supplémentaires si nécessaire.
   * @param {Array} pools - Liste des pools.
   * @param {Array} planning - Liste des créneaux horaires.
   * @param {Array} fields - Liste des terrains disponibles.
   * @param {Object} scheduleTourney - Configuration du planning du tournoi.
   * @param {number} poolDuration - Durée d'une session de pool en minutes.
   */
  async balancePoolSessions(pools, planning, fields, tourneyDate, poolDuration) {
    const maxSessions = Math.max(...this.poolTotalAssignments.values());
    const poolsNeedingExtraSessions = pools.filter(pool => this.poolTotalAssignments.get(pool.id) < maxSessions);

    for (const pool of poolsNeedingExtraSessions) {
      const sessionsNeeded = maxSessions - this.poolTotalAssignments.get(pool.id);

      for (let i = 0; i < sessionsNeeded; i++) {
        let assigned = false;

        for (const timeSlot of planning) {
          if (this.poolsAssignedAtTimeSlot[timeSlot].has(pool.id)) continue; // Pool déjà assignée à ce créneau

          // Rechercher les sports disponibles à ce créneau
          const sportsAvailable = this.getSportsAvailableAtTimeSlot(timeSlot, fields, poolDuration);

          // Prioriser les sports les moins joués par la pool
          const sportsPlayed = this.poolPlayedSports.get(pool.id);
          const possibleSports = Array.from(sportsAvailable.keys()).sort((a, b) => {
            const countA = sportsPlayed.get(a) || 0;
            const countB = sportsPlayed.get(b) || 0;
            return countA - countB;
          });

          for (const sportId of possibleSports) {
            const fieldsAvailable = sportsAvailable.get(sportId);

            while (fieldsAvailable.length > 0) {
              const fieldAssignment = fieldsAvailable.shift();

              // Vérifier si le terrain est déjà assigné à ce créneau
              if (this.fieldsAssignedAtTimeSlot[timeSlot].has(fieldAssignment.field.id)) {
                continue; // Passer au terrain suivant
              }

              // Assigner la pool au terrain
              await this.assignPoolToTimeSlot(pool.id, timeSlot, sportId, fieldAssignment, tourneyDate, poolDuration);

              assigned = true;
              break; // Sortir de la boucle des sports
            }

            if (assigned) {
              break; // Sortir de la boucle des sports
            }
          }

          if (assigned) {
            break; // Sortir de la boucle des créneaux
          }
        }

        if (!assigned) {
          console.warn(`Impossible d'assigner une session supplémentaire à la pool ${pool.id}`);
        }
      }
    }
  }

  /**
   * Récupère les sports disponibles à un créneau horaire donné.
   * @param {number} timeSlot - Créneau horaire en minutes.
   * @param {Array} fields - Liste des terrains disponibles.
   * @param {number} poolDuration - Durée d'une session de pool en minutes.
   * @returns {Map} - Map<sportId, Array<{ field, sportsField }>>
   */
  getSportsAvailableAtTimeSlot(timeSlot, fields, poolDuration) {
    const sportsAvailable = new Map();

    fields.forEach((field) => {
      const validSportsFields = field.sportsFields.filter((sf) => {
        const fieldStartMinutes = this.timeToMinutes(sf.startTime);
        const fieldEndMinutes = this.timeToMinutes(sf.endTime);
        return (
          timeSlot >= fieldStartMinutes &&
          timeSlot + poolDuration <= fieldEndMinutes
        );
      });

      validSportsFields.forEach((sf) => {
        // Vérifier si le terrain est déjà assigné à ce créneau
        if (this.fieldsAssignedAtTimeSlot[timeSlot] && this.fieldsAssignedAtTimeSlot[timeSlot].has(field.id)) {
          return; // Terrain déjà occupé
        }

        const sportId = sf.sportId;
        if (!sportsAvailable.has(sportId)) {
          sportsAvailable.set(sportId, []);
        }
        sportsAvailable.get(sportId).push({
          field,
          sportsField: sf,
        });
      });
    });

    return sportsAvailable;
  }

  /**
   * Assigne une pool à un créneau horaire donné.
   * @param {number} poolId - Identifiant de la pool.
   * @param {number} timeSlot - Créneau horaire en minutes.
   * @param {number} sportId - Identifiant du sport.
   * @param {Object} fieldAssignment - Terrain assigné.
   * @param {Object} scheduleTourney - Configuration du planning du tournoi.
   * @param {number} poolDuration - Durée d'une session de pool en minutes.
   */
  async assignPoolToTimeSlot(poolId, timeSlot, sportId, fieldAssignment, tourneyDate, poolDuration) {
    const { field } = fieldAssignment;

    // Créer le PoolSchedule
    await PoolSchedule.create({
      poolId,
      fieldId: field.id,
      startTime: this.minutesToTime(timeSlot),
      endTime: this.minutesToTime(timeSlot + poolDuration),
      date: tourneyDate || new Date(),
      sportId: sportId,
    });

    // Mettre à jour les structures de données
    const sportsPlayed = this.poolPlayedSports.get(poolId);
    sportsPlayed.set(sportId, (sportsPlayed.get(sportId) || 0) + 1);

    this.poolTotalAssignments.set(poolId, this.poolTotalAssignments.get(poolId) + 1);
    this.poolsAssignedAtTimeSlot[timeSlot].add(poolId);

    // Marquer le terrain comme occupé à ce créneau
    if (!this.fieldsAssignedAtTimeSlot[timeSlot]) {
      this.fieldsAssignedAtTimeSlot[timeSlot] = new Set();
    }
    this.fieldsAssignedAtTimeSlot[timeSlot].add(field.id);
  }

  /**
   * Convertit une heure au format "HH:MM" en minutes.
   * @param {string} timeStr - Heure au format "HH:MM".
   * @returns {number} - Heure en minutes.
   */
  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convertit des minutes en heure au format "HH:MM:SS".
   * @param {number} totalMinutes - Nombre total de minutes.
   * @returns {string} - Heure au format "HH:MM:SS".
   */
  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:00`;
  }
}

module.exports = CustomRoundRobinPlanning;
