// services/planningStrategies/pool/planningStrategyManager.js
const CustomRoundRobinPlanning = require('./customRoundRobinPlanning');

class PlanningStrategyManager {
  constructor(tourneyId, strategyName) {
    this.tourneyId = tourneyId;
    this.strategy = this.getStrategy(strategyName);
  }

  getStrategy(strategyName) {
    switch (strategyName) {
      case 'customRoundRobin':
      default:
        return new CustomRoundRobinPlanning(this.tourneyId);
    }
  }

  async generatePlanning() {
    return this.strategy.generatePlanning();
  }
}

module.exports = PlanningStrategyManager;
