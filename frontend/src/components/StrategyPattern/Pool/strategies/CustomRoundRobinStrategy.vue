<!-- components/StrategyPattern/Pool/strategies/CustomRoundRobinStrategy.vue -->
<template>
  <div>
    <p class="mb-4 text-light-form-text dark:text-dark-form-text">
      <span class="text-light-form-error dark:text-dark-form-error font-bold">
        <strong>Attention :</strong> Les pools existantes et les plannings
        associés seront supprimés. Il est préférable d'effectuer cette action
        une fois les inscriptions terminées. </span
      ><br />
      Cet algorithme (custom round robin) va générer des pools et assigner les
      équipes du tournoi aux pools de manière optimisée, en prenant en compte le
      nombre de terrains disponibles ainsi que les réglages.
      <strong
        >Il ne va jamais générer plus de Pools qu'il n'y a de terrains</strong
      >.<br />
    </p>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import { toast } from 'vue3-toastify';

  export default {
    props: {
      tourneyId: {
        type: String,
        required: true,
      },
      teams: {
        type: Array,
        required: true,
      },
      pools: {
        type: Array,
        required: true,
      },
      availableFields: {
        type: Number,
        required: true,
      },
    },
    methods: {
      async generatePools() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/pools/generate`
          );

          const { pools, teamsWithoutPool } = response.data;
          const poolCount = pools.length;
          const teamsWithoutPoolCount = teamsWithoutPool.length;

          toast.success(
            `Pools générées avec succès ! ${poolCount} pools ont été créées.`,
            {
              autoClose: 3000,
            }
          );
          if (teamsWithoutPoolCount > 0) {
            toast.warning(
              `${teamsWithoutPoolCount} équipes n'ont pas pu être assignées aux Pools.`,
              {
                autoClose: 4000,
              }
            );
          }
          return true;
        } catch (error) {
          console.error('Erreur lors de la génération des pools :', error);
          const errorMessage =
            error.response?.data?.message ||
            'Erreur lors de la génération des pools.';
          toast.error(errorMessage);
          return false;
        }
      },
    },
  };
</script>
