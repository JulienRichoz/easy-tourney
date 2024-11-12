// services/poolStrategies/poolStrategyManager.js
const customRoundRobin = require('./customRoundRobin');
// Importer les différentes stratégies de génération de pools

class PoolStrategyManager {
  constructor(tourneyId, strategyName) {
    this.tourneyId = tourneyId;
    this.strategy = this.getStrategy(strategyName);
  }

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

  async generatePools(poolCount) {
    return this.strategy.generatePools(poolCount);
  }
}

module.exports = PoolStrategyManager;
