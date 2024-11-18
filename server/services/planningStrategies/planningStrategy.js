// services/planningStrategies/planningStrategy.js
class PlanningStrategy {
    constructor(tourneyId) {
      this.tourneyId = tourneyId;
    }
  
    async generatePlanning() {
      throw new Error('generatePlanning() doit être implémenté par la stratégie concrète.');
    }
  }
  
  module.exports = PlanningStrategy;
  