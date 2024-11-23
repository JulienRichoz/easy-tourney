// services/gameStrategies/gameStrategy.js

/**
 * Classe abstraite représentant une stratégie de planification de matchs.
 */
class GameStrategy {
    constructor(tourneyId) {
        this.tourneyId = tourneyId;
    }

    /**
     * Méthode abstraite à implémenter pour générer les matchs.
     */
    async generateGames() {
        throw new Error('generateGames() doit être implémenté par la stratégie concrète.');
    }

    /**
     * Méthode abstraite à implémenter pour valider les matchs.
     */
    async validateGames() {
        throw new Error('validateGames() doit être implémenté par la stratégie concrète.');
    }
}

module.exports = GameStrategy;
