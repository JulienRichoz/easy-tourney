// services/planningStrategies/customRoundRobinPlanning.js
const PlanningStrategy = require('./planningStrategy');
const { Pool, PoolPlanning, Field, PlanningTourney, SportsFields } = require('../../models');

class CustomRoundRobinPlanning extends PlanningStrategy {
  async generatePlanning() {
    // Récupérer les pools du tournoi
    const pools = await Pool.findAll({ where: { tourneyId: this.tourneyId } });

    if (pools.length === 0) {
      throw new Error('Aucune pool disponible pour générer le planning.');
    }

    // Récupérer les terrains et leurs disponibilités
    const fields = await Field.findAll({
      where: { tourneyId: this.tourneyId },
      include: {
        model: SportsFields,
        as: 'sportsFields',
        attributes: ['startTime', 'endTime', 'sportId'],
      },
    });

    if (fields.length === 0) {
      throw new Error('Aucun terrain disponible pour ce tournoi.');
    }

    // Récupérer la configuration du planning
    const planningTourney = await PlanningTourney.findOne({
      where: { tourneyId: this.tourneyId },
    });

    if (!planningTourney) {
      throw new Error('Aucune configuration de planning trouvée pour ce tournoi.');
    }

    // Variables pour la planification
    const { startTime, endTime, timePoolRotation, lunchStart, lunchEnd } = planningTourney;

    // Convertir les heures en minutes pour faciliter les calculs
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    const lunchStartMinutes = lunchStart ? this.timeToMinutes(lunchStart) : null;
    const lunchEndMinutes = lunchEnd ? this.timeToMinutes(lunchEnd) : null;
    const rotationDuration = timePoolRotation; // en minutes

    // Initialiser le tableau des créneaux horaires
    let planning = [];

    // Calculer les créneaux disponibles
    let currentTime = startMinutes;
    while (currentTime < endMinutes) {
      // Sauter la pause déjeuner
      if (lunchStartMinutes && lunchEndMinutes && currentTime >= lunchStartMinutes && currentTime < lunchEndMinutes) {
        currentTime = lunchEndMinutes;
        continue;
      }

      planning.push(currentTime);
      currentTime += rotationDuration;
    }

    // Répartir les pools sur les terrains et les créneaux horaires
    let poolIndex = 0;
    const totalPools = pools.length;
    const totalFields = fields.length;

    // Supprimer les PoolPlannings existants
    await PoolPlanning.destroy({ where: { poolId: pools.map(p => p.id) } });

    for (let timeSlot of planning) {
      for (let field of fields) {
        if (poolIndex >= totalPools) break;

        const pool = pools[poolIndex];

        // Créer le PoolPlanning
        await PoolPlanning.create({
          poolId: pool.id,
          fieldId: field.id,
          startTime: this.minutesToTime(timeSlot),
          endTime: this.minutesToTime(timeSlot + rotationDuration),
          date: planningTourney.date || new Date(), // Utilisez la date du tournoi ou la date actuelle
        });

        poolIndex++;
      }
      if (poolIndex >= totalPools) break;
    }

    return { message: 'Planning généré avec succès.' };
  }

  timeToMinutes(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
}

module.exports = CustomRoundRobinPlanning;
