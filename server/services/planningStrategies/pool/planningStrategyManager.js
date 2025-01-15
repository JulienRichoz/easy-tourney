// services/planningStrategies/pool/planningStrategyManager.js

const CustomRoundRobinPoolPlanning = require('./customRoundRobinPoolPlanning');
/**
 * Gestionnaire de stratégie de planification pour les pools.
 * 
 * Cette classe agit comme un "contexte" dans le Strategy Pattern. Elle est responsable de :
 * - Sélectionner et instancier la stratégie appropriée en fonction du type de tournoi.
 * - Déléguer les appels aux méthodes de génération et de validation du planning à la stratégie choisie.
 * 
 * Ce gestionnaire permet de rendre le code extensible : il suffit d'ajouter une nouvelle stratégie
 * et de l'inclure dans la méthode `getStrategy()` pour supporter de nouveaux types de tournois.
 */
class PlanningStrategyManager {
  /**
   * Constructeur du gestionnaire de stratégie.
   * @param {number} tourneyId - L'identifiant unique du tournoi.
   * @param {string} strategyName - Le nom de la stratégie à utiliser (par exemple : "customRoundRobin").
   * @param {Object} options - Options supplémentaires pour la stratégie (exemple : randomMode).
   */
  constructor(tourneyId, strategyName, options = {}) {
    this.tourneyId = tourneyId;
    this.strategy = this.getStrategy(strategyName, options);
  }

  /**
   * Sélectionne et instancie une stratégie en fonction du nom fourni.
   * 
   * Si une nouvelle stratégie est ajoutée, elle doit être référencée ici.
   * 
   * @param {string} strategyName - Le nom de la stratégie.
   * @param {Object} options - Options supplémentaires spécifiques à la stratégie.
   * @returns {PlanningStrategy} Une instance de la stratégie choisie.
   */
  getStrategy(strategyName, options) {
    switch (strategyName) {
      case 'customRoundRobin':
      default:
        return new CustomRoundRobinPoolPlanning(this.tourneyId, options);
    }
  }

  /**
   * Délègue la génération du planning à la stratégie sélectionnée.
   * 
   * @returns {Promise} Un planning généré par la stratégie.
   */
  async generatePlanning() {
    return this.strategy.generatePlanning();
  }

  /**
   * Délègue la validation du planning à la stratégie sélectionnée.
   * 
   * @returns {Promise<Object>} Les résultats de la validation.
   */
  async validatePlanning() {
    return this.strategy.validatePlanning();
  }
}

module.exports = PlanningStrategyManager;
