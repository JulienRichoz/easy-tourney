// services/planningStrategies/pool/customRoundRobinPlanning.js
const PlanningStrategy = require('./planningStrategy');
const { Pool, PoolSchedule, Field, ScheduleTourney, SportsFields, Sport } = require('../../../models');

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
        include: {
          model: Sport,
          as: "sport",
          attributes: ["id", "name"],
        },
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
    const { startTime, endTime, timePoolRotation, lunchStart, lunchEnd } = scheduleTourney;

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

    const totalPools = pools.length;
    const totalFields = fields.length;

    // Boucler sur les créneaux horaires avec rotation des pools
    for (let timeSlotIndex = 0; timeSlotIndex < planning.length; timeSlotIndex++) {
      let timeSlot = planning[timeSlotIndex];
      for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
        let field = fields[fieldIndex];

        // Calculer l'index du pool avec rotation
        let poolIndex = (fieldIndex + timeSlotIndex) % totalPools;
        let pool = pools[poolIndex];

        // Vérifier les créneaux horaires des SportsFields
        const validSportsField = field.sportsFields.find((sf) => {
          const fieldStartMinutes = this.timeToMinutes(sf.startTime);
          const fieldEndMinutes = this.timeToMinutes(sf.endTime);
          return (
            timeSlot >= fieldStartMinutes &&
            timeSlot + rotationDuration <= fieldEndMinutes
          );
        });

        if (!validSportsField) {
          continue; // Passer au prochain terrain si non valide
        }

        // Créer le PoolSchedule
        await PoolSchedule.create({
          poolId: pool.id,
          fieldId: field.id,
          startTime: this.minutesToTime(timeSlot),
          endTime: this.minutesToTime(timeSlot + rotationDuration),
          date: scheduleTourney.date || new Date(),
          sportId: validSportsField.sportId, // Ajouter le sport associé
        });
      }
    }

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
