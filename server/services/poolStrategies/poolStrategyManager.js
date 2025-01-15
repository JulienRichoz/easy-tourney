// services/poolStrategies/poolStrategyManager.js

const customRoundRobin = require('./customRoundRobin');

/**
 * Gestionnaire de stratégie pour la génération de pools.
 * 
 * Cette classe agit comme un "contexte" dans le Strategy Pattern. Elle est responsable de :
 * - Sélectionner et instancier la stratégie appropriée en fonction du type de tournoi.
 * - Déléguer les appels aux méthodes de génération de pools à la stratégie choisie.
 * 
 * Ce gestionnaire permet de rendre le code extensible : il suffit d'ajouter une nouvelle stratégie
 * et de l'inclure dans la méthode `getStrategy()` pour supporter de nouveaux types de tournois.
 */
class PoolStrategyManager {
  /**
   * Constructeur du gestionnaire de stratégie.
   * @param {*} tourneyId - L'identifiant unique du tournoi.
   * @param {*} strategyName - Le nom de la stratégie à utiliser (par exemple : "customRoundRobin").
   */
  constructor(tourneyId, strategyName) {
    this.tourneyId = tourneyId;
    this.strategy = this.getStrategy(strategyName);
  }

  /**
   * Sélectionne et instancie une stratégie en fonction du nom fourni.
   * Si une nouvelle stratégie est ajoutée, elle doit être référencée ici.
   * 
   * @param {*} strategyName - Le nom de la stratégie.
   * @returns {PoolStrategy}- Une instance de la stratégie choisie.
   */
  getStrategy(strategyName) {
    switch (strategyName) {
      /*
      Implémenter les différents types de stratégies
      */
      case 'customRoundRobin':
      default:
        return new customRoundRobin(this.tourneyId);
    }
  }

  /**
   * Délègue la génération des pools à la stratégie sélectionnée.
   * @param {*} poolCount - Le nombre de pools à générer.
   * @returns {Promise} Les pools générés par la stratégie.
   */
  async generatePools(poolCount) {
    return this.strategy.generatePools(poolCount);
  }
}

module.exports = PoolStrategyManager;
