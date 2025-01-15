// services/planningStrategies/pool/planningStrategy.js

/**
 * "Interface" représentant une stratégie de planification.
 * Les classes concrètes doivent hériter de cette interface et implémenter les méthodes :
 * - generatePlanning() : Génère un planning basé sur les règles définies par la stratégie.
 * - validatePlanning() : Valide le planning généré pour vérifier qu'il respecte les contraintes.
 * 
 * Cette "interface" est simulée en JavaScript, car le langage ne supporte pas les interfaces 
 * nativement. Pour imposer un contrat, les méthodes lèvent une erreur si elles ne sont pas implémentées.
 */
class PlanningStrategy {
  /**
   * Constructeur de l'interface de stratégie.
   * @param {number} tourneyId - L'identifiant unique du tournoi.
   */
  constructor(tourneyId) {
    this.tourneyId = tourneyId;
  }

  /**
   * Méthode abstraite pour générer un planning.
   * Les classes concrètes doivent fournir leur propre implémentation.
   * @throws {Error} Si la méthode n'est pas implémentée.
   */
  async generatePlanning() {
    throw new Error(
      'generatePlanning() doit être implémenté par la stratégie concrète.'
    );
  }

  /**
   * Méthode abstraite pour valider un planning.
   * Les classes concrètes doivent fournir leur propre implémentation.
   * @returns {Object} Résultats de la validation avec différents niveaux d'erreurs.
   * @throws {Error} Si la méthode n'est pas implémentée.
   */
  async validatePlanning() {
    throw new Error(
      'validatePlanning() doit être implémenté par la stratégie concrète.'
    );
  }
}

module.exports = PlanningStrategy;
