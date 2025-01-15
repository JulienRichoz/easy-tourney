// services/gameStrategies/gameStrategy.js

/**
 * Interface représentant une stratégie de planification pour les matchs.
 * Les classes concrètes doivent hériter de cette interface et implémenter les méthodes :
 * - generateGames() : Génère les matchs basés sur les règles définies par la stratégie.
 * - validateGames() : Valide les matchs générés pour vérifier qu'ils respectent les contraintes.
 * 
 * Cette "interface" est simulée en JavaScript, car le langage ne supporte pas les interfaces
 * nativement. Pour imposer un contrat, les méthodes lèvent une erreur si elles ne sont pas implémentées.
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
