const PoolStrategy = require('./poolStrategy');
const { Pool, Team, Field, Tourney } = require('../../models');

class CustomRoundRobin extends PoolStrategy {
  /**
   * Méthode pour générer des pools en utilisant une stratégie personnalisée
   * @returns {Promise<{pools: Pool[], teamsWithoutPool: Team[]}>}
   */
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

    const tourney = await Tourney.findByPk(this.tourneyId);
    const maxPools = Math.min(
      tourney?.maxNumberOfPools || fieldCount,
      fieldCount
    ); // Limiter au nombre de terrains
    const minTeamPerPool = tourney?.defaultMinTeamPerPool || 3;
    const maxTeamPerPool = tourney?.defaultMaxTeamPerPool || 6;

    // Calculer le nombre initial de pools
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

    // Limiter au maximum de pools défini dans la configuration
    poolCount = Math.min(poolCount, maxPools);

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

    // Répartir les équipes dans les pools
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
        'Considérez d\'augmenter le nombre de terrains ou de réduire la taille minimale des équipes par pool.'
      );
    }

    return { pools, teamsWithoutPool };
  }

  /**
   * Méthode pour générer les pools manquantes
   * @returns {Promise<Pool[]>}
   */
  async generateMissingPools() {
    // Récupérer les pools existantes
    const existingPools = await Pool.findAll({
      where: { tourneyId: this.tourneyId },
    });
    const existingPoolCount = existingPools.length;

    // Récupérer les configurations du tournoi
    const tourney = await Tourney.findByPk(this.tourneyId);
    const maxPools = tourney?.maxNumberOfPools || 0;

    if (existingPoolCount >= maxPools) {
      throw new Error('Nombre maximal de pools déjà atteint.');
    }

    const poolsToCreate = maxPools - existingPoolCount;

    // Créer les nouvelles pools
    const newPools = [];
    for (let i = 0; i < poolsToCreate; i++) {
      const poolName = `Pool ${String.fromCharCode(65 + existingPoolCount + i)}`;
      const pool = await Pool.create({
        name: poolName,
        tourneyId: this.tourneyId,
        maxTeamPerPool: tourney.defaultMaxTeamPerPool || null,
        minTeamPerPool: tourney.defaultMinTeamPerPool || null,
      });
      newPools.push(pool);
    }

    return newPools;
  }

  /**
   * Méthode pour assigner les équipes non assignées aux pools manquantes
   * @returns {Promise<Team[]>}
   */
  async populateMissingPools() {
    // Récupérer les équipes non assignées
    const unassignedTeams = await Team.findAll({
      where: {
        tourneyId: this.tourneyId,
        type: 'player',
        poolId: null,
      },
      order: [['id', 'ASC']],
    });

    if (unassignedTeams.length === 0) {
      throw new Error('Aucune équipe non assignée disponible.');
    }

    // Récupérer les pools existantes avec leurs équipes
    const pools = await Pool.findAll({
      where: { tourneyId: this.tourneyId },
      include: [{ model: Team, as: 'teams' }],
    });

    if (pools.length === 0) {
      throw new Error('Aucune pool disponible pour assigner les équipes.');
    }

    // Récupérer les réglages globaux
    const tourney = await Tourney.findByPk(this.tourneyId);
    const minTeamPerPool = tourney?.defaultMinTeamPerPool || 3;
    const maxTeamPerPool = tourney?.defaultMaxTeamPerPool || 6;

    let teamsToAssign = [...unassignedTeams];

    // Étape 1 : Remplir les pools jusqu'au minTeamPerPool
    for (const pool of pools) {
      const currentTeamCount = pool.teams.length;
      const teamsNeeded = minTeamPerPool - currentTeamCount;

      if (teamsNeeded > 0) {
        const teamsForPool = teamsToAssign.splice(0, teamsNeeded);
        for (const team of teamsForPool) {
          await team.update({ poolId: pool.id });
        }
      }

      // Mettre à jour les équipes de la pool
      pool.teams = await pool.getTeams();
    }

    // Étape 2 : Remplir les pools valides jusqu'au maxTeamPerPool
    for (const pool of pools) {
      const currentTeamCount = pool.teams.length;
      const additionalTeamsAllowed = maxTeamPerPool - currentTeamCount;

      if (additionalTeamsAllowed > 0) {
        const teamsForPool = teamsToAssign.splice(0, additionalTeamsAllowed);
        for (const team of teamsForPool) {
          await team.update({ poolId: pool.id });
        }
      }

      // Mettre à jour les équipes de la pool
      pool.teams = await pool.getTeams();
    }

    // Les équipes restantes sont non assignées
    const assignedTeams = unassignedTeams.filter((team) => team.poolId);

    return assignedTeams;
  }
}

module.exports = CustomRoundRobin;
