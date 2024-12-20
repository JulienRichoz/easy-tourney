// services/planningStrategies/pool/planningStrategyManager.js
const CustomRoundRobinPoolPlanning = require('./customRoundRobinPoolPlanning');

class PlanningStrategyManager {
  constructor(tourneyId, strategyName, options = {}) {
    this.tourneyId = tourneyId;
    this.strategy = this.getStrategy(strategyName, options);
  }

  getStrategy(strategyName, options) {
    switch (strategyName) {
      case 'customRoundRobin':
      default:
        return new CustomRoundRobinPoolPlanning(this.tourneyId, options);
    }
  }

  async generatePlanning() {
    return this.strategy.generatePlanning();
  }

  async validatePlanning() {
    return this.strategy.validatePlanning();
  }
}

module.exports = PlanningStrategyManager;
