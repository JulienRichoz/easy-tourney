// services/planningStrategies/pool/customRoundRobinPlanning.js
const PlanningStrategy = require('./planningStrategy');
const { Pool, PoolSchedule, Field, ScheduleTourney, SportsFields } = require('../../../models');

class CustomRoundRobinPlanning extends PlanningStrategy {
  async generatePlanning() {
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
        as: "sportsFields",
        attributes: ["startTime", "endTime", "sportId"],
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

    // Variables pour la planification
    const { startTime, endTime, timePoolRotation, lunchStart, lunchEnd } =
      scheduleTourney;

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const lunchStartMinutes = lunchStart ? this.timeToMinutes(lunchStart) : null;
    const lunchEndMinutes = lunchEnd ? this.timeToMinutes(lunchEnd) : null;
    const rotationDuration = timePoolRotation;

    // Initialiser les créneaux horaires
    let planning = [];
    let currentTime = startMinutes;

    while (currentTime < endMinutes) {
      if (
        lunchStartMinutes &&
        lunchEndMinutes &&
        currentTime >= lunchStartMinutes &&
        currentTime < lunchEndMinutes
      ) {
        currentTime = lunchEndMinutes;
        continue;
      }
      planning.push(currentTime);
      currentTime += rotationDuration;
    }

    // Supprimer les PoolSchedules existants
    await PoolSchedule.destroy({ where: { poolId: pools.map((p) => p.id) } });

    let poolIndex = 0;
    const totalPools = pools.length;

    // Suivi des terrains déjà utilisés par créneau
    let usedFields = {};

    // Boucler sur les créneaux horaires
    for (let timeSlot of planning) {
      usedFields[timeSlot] = new Set(); // Initialiser un ensemble pour suivre les terrains utilisés
      for (let field of fields) {
        if (poolIndex >= totalPools) break;

        const pool = pools[poolIndex];

        // Vérifier les créneaux horaires des SportsFields
        const validSportsField = field.sportsFields.find((sf) => {
          const fieldStartMinutes = this.timeToMinutes(sf.startTime);
          const fieldEndMinutes = this.timeToMinutes(sf.endTime);
          return (
            timeSlot >= fieldStartMinutes &&
            timeSlot + rotationDuration <= fieldEndMinutes
          );
        });

        if (!validSportsField || usedFields[timeSlot].has(field.id)) {
          continue; // Passer au prochain terrain si non valide ou déjà utilisé
        }

        // Marquer le terrain comme utilisé
        usedFields[timeSlot].add(field.id);

        // Créer le PoolSchedule
        await PoolSchedule.create({
          poolId: pool.id,
          fieldId: field.id,
          startTime: this.minutesToTime(timeSlot),
          endTime: this.minutesToTime(timeSlot + rotationDuration),
          date: scheduleTourney.date || new Date(),
          sportId: validSportsField.sportId, // Ajouter le sport associé
        });

        // Passer à la pool suivante
        poolIndex = (poolIndex + 1) % totalPools;
      }
    }
mo
    return { message: "Planning généré avec succès." };
  }

  timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  }
}

module.exports = CustomRoundRobinPlanning;

