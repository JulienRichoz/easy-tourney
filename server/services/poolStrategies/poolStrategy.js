/* POOL STRAGEY PATTERN
Le Strategy Pattern est un patron de conception comportemental qui permet de définir une famille d'algorithmes, 
de les encapsuler individuellement et de les rendre interchangeables. 
Il permet de choisir dynamiquement l'algorithme approprié à exécuter au moment de l'exécution.

Mise en place d'iune interface que toutes les stratégies d'algorithmes implémenteront
*/


// services/poolStrategies/poolStrategy.js
class PoolStrategy {
    constructor(tourneyId) {
      this.tourneyId = tourneyId;
    }
  
    async generatePools() {
      throw new Error('generatePools() doit être implémenté par la stratégie concrète.');
    }
}
  
module.exports = PoolStrategy;