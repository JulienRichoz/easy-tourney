// services/planningStrategies/pool/planningStrategy.js
class PlanningStrategy {
  constructor(tourneyId) {
    this.tourneyId = tourneyId;
  }

  async generatePlanning() {
    throw new Error(
      'generatePlanning() doit être implémenté par la stratégie concrète.'
    );
  }

  /**
   * Valide le planning selon les règles spécifiques à la stratégie.
   * @returns {Object} Résultats de la validation avec différents niveaux d'erreurs.
   */
  async validatePlanning() {
    throw new Error(
      'validatePlanning() doit être implémenté par la stratégie concrète.'
    );
  }
}

module.exports = PlanningStrategy;
