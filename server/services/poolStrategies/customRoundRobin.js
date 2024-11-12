// services/poolStrategies/customRoundRobin.js
const PoolStrategy = require('./poolStrategy');
const { Pool, Team } = require('../../models');

class CustomRoundRobin extends PoolStrategy {
  async generatePools(poolCount) {
    // Répartir les équipes de manière égale dans le nombre de pools spécifié
    const teams = await Team.findAll({
      where: { tourneyId: this.tourneyId },
      order: [['id', 'ASC']],
    });

    const teamCount = teams.length;
    const pools = [];

    // Supprimer les pools existantes du tournoi
    await Pool.destroy({ where: { tourneyId: this.tourneyId } });

    // Créer les pools
    for (let i = 0; i < poolCount; i++) {
      const pool = await Pool.create({
        name: `Pool ${String.fromCharCode(65 + i)}`,
        tourneyId: this.tourneyId,
      });
      pools.push(pool);
    }

    // Répartir les équipes dans les pools
    for (let i = 0; i < teamCount; i++) {
      const poolIndex = i % poolCount;
      await teams[i].update({ poolId: pools[poolIndex].id });
    }

    return pools;
  }
}

module.exports = CustomRoundRobin;
