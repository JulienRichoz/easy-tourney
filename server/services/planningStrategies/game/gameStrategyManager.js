// services/gameStrategies/gameStrategyManager.js

const CustomRoundRobinGamePlanning = require('./customRoundRobinGamePlanning');

class GameStrategyManager {
    constructor(tourneyId, strategyName, options = {}) {
        this.tourneyId = tourneyId;
        this.strategy = this.getStrategy(strategyName, options);
    }

    getStrategy(strategyName, options) {
        switch (strategyName) {
            case 'customRoundRobin':
            default:
                return new CustomRoundRobinGamePlanning(this.tourneyId, options);
        }
    }

    async generateGames() {
        return this.strategy.generateGames();
    }

    async validateGames() {
        return this.strategy.validateGames();
    }
}

module.exports = GameStrategyManager;
