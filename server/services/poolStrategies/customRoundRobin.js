// services/poolStrategies/customRoundRobin.js
const PoolStrategy = require('./poolStrategy');
const { Pool, Team, Field, TourneySetup } = require('../../models');

/**
 * Algorithme pour remplir des Pools équitablement selon le nombre de teams
 * Le but est ensuite de les faire jouer sans élimination, donc pas de création de pool anticipée pour les gagnants/perdants/etc.
 */
class CustomRoundRobin extends PoolStrategy {
  async generatePools() {
    // Récupérer les équipes de type 'player' (exclure les 'assistant')
    const teams = await Team.findAll({
      where: {
        tourneyId: this.tourneyId,
        type: 'player',
      },
      order: [['id', 'ASC']],
    });

    const teamCount = teams.length;

    if (teamCount === 0) {
      throw new Error('Aucune équipe disponible pour générer des pools.');
    }

    // Récupérer le nombre de terrains disponibles
    const fields = await Field.findAll({
      where: { tourneyId: this.tourneyId },
    });
    const fieldCount = fields.length;

    if (fieldCount === 0) {
      throw new Error('Aucun terrain disponible pour ce tournoi.');
    }

    // Récupérer les configurations des pools
    const tourneySetup = await TourneySetup.findOne({
      where: { tourneyId: this.tourneyId },
    });

    const minTeamPerPool = tourneySetup?.defaultMinTeamPerPool || 3;
    const maxTeamPerPool = tourneySetup?.defaultMaxTeamPerPool || 6;

    if (teamCount < minTeamPerPool) {
      throw new Error(
        `Nombre insuffisant d'équipes pour créer des pools (minimum requis : ${minTeamPerPool}).`
      );
    }

    // Calculer le nombre optimal de pools
    let poolCount = Math.min(fieldCount, Math.floor(teamCount / minTeamPerPool));

    if (poolCount === 0) {
      poolCount = 1;
    }

    // Ajuster le nombre de pools pour respecter les contraintes min/max
    while (poolCount > 1) {
      const teamsPerPool = Math.floor(teamCount / poolCount);
      if (teamsPerPool >= minTeamPerPool && teamsPerPool <= maxTeamPerPool) {
        break;
      }
      poolCount--;
    }

    // Vérifier que les équipes par pool respectent les contraintes
    const teamsPerPool = Math.ceil(teamCount / poolCount);
    if (teamsPerPool > maxTeamPerPool) {
      poolCount = Math.ceil(teamCount / maxTeamPerPool);
    }

    // Supprimer les pools existantes
    await Pool.destroy({ where: { tourneyId: this.tourneyId } });

    // Créer les pools
    const pools = [];
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
