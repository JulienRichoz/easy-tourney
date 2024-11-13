// services/poolStrategies/customRoundRobin.js

const PoolStrategy = require('./poolStrategy');
const { Pool, Team, Field, Tourney } = require('../../models');

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

    // Récupérer le nombre de terrains disponibles et les configurations
    const fields = await Field.findAll({
      where: { tourneyId: this.tourneyId },
    });
    const fieldCount = fields.length;

    if (fieldCount === 0) {
      throw new Error('Aucun terrain disponible pour ce tournoi.');
    }

    // Récupérer le nombre maximal de pools depuis la configuration du tournoi
    const tourney = await Tourney.findByPk(this.tourneyId);
    const maxPools = tourney?.maxPools || fieldCount; // Nombre de pools max ou égal au nombre de terrains

    const minTeamPerPool = tourney?.defaultMinTeamPerPool || 3;
    const maxTeamPerPool = tourney?.defaultMaxTeamPerPool || 6;

    // Calculer le nombre de pools nécessaires en respectant le nombre max de pools
    let poolCount = Math.min(maxPools, Math.floor(teamCount / minTeamPerPool));

    // Ajuster le nombre de pools pour respecter les contraintes min/max
    while (poolCount > 1) {
      const teamsPerPool = Math.floor(teamCount / poolCount);
      if (teamsPerPool >= minTeamPerPool && teamsPerPool <= maxTeamPerPool) {
        break;
      }
      poolCount--;
    }

    // Vérifier si le nombre de pools calculé est suffisant pour toutes les équipes
    const teamsPerPool = Math.ceil(teamCount / poolCount);
    if (teamsPerPool > maxTeamPerPool) {
      poolCount = Math.min(maxPools, Math.ceil(teamCount / maxTeamPerPool));
    }

    // Supprimer les pools existantes
    await Pool.destroy({ where: { tourneyId: this.tourneyId } });

    // Créer les pools avec les configurations spécifiques
    const pools = [];
    for (let i = 0; i < poolCount; i++) {
      const pool = await Pool.create({
        name: `Pool ${String.fromCharCode(65 + i)}`,
        tourneyId: this.tourneyId,
        maxTeamPerPool: maxTeamPerPool,
        minTeamPerPool: minTeamPerPool,
      });
      pools.push(pool);
    }

    // Répartir les équipes dans les pools, les excédentaires seront sans pool
    const teamsWithoutPool = [];
    for (let i = 0; i < teamCount; i++) {
      if (i < poolCount * maxTeamPerPool) {
        const poolIndex = i % poolCount;
        await teams[i].update({ poolId: pools[poolIndex].id });
      } else {
        teamsWithoutPool.push(teams[i]);
      }
    }

    // Si des équipes n'ont pas pu être assignées à un pool, afficher un avertissement
    if (teamsWithoutPool.length > 0) {
      console.warn(
        `${teamsWithoutPool.length} équipes n'ont pas pu être assignées aux pools. ` +
        `Considérez d'augmenter le nombre de terrains ou d'ajuster la taille des équipes.`
      );
    }

    return { pools, teamsWithoutPool };
  }
}

module.exports = CustomRoundRobin;
