// src/services/poolStrategies/poolStrategy.js

/**
 * "Interface" représentant une stratégie de génération de pools.
 * Les classes concrètes doivent hériter de cette interface et implémenter la méthode :
 * - generatePools() : Génère les pools basés sur les règles définies par la stratégie.
 * 
 * Cette "interface" est simulée en JavaScript, car le langage ne supporte pas les interfaces
 * nativement. Pour imposer un contrat, la méthode lève une erreur si elle n'est pas implémentée.
 */

// services/poolStrategies/poolStrategy.js
class PoolStrategy {
  /**
   * Constructeur de l'interface de stratégie.
   * @param {*} tourneyId - L'identifiant unique du tournoi.
   */
  constructor(tourneyId) {
    this.tourneyId = tourneyId;
  }

  /**
   * Méthode abstraite pour générer les pools.
   * Les classes concrètes doivent fournir leur propre implémentation.
   * @throws {Error} Si la méthode n'est pas implémentée.
   */
  async generatePools() {
    throw new Error(
      'generatePools() doit être implémenté par la stratégie concrète.'
    );
  }
}

module.exports = PoolStrategy;
