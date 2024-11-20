<!-- components/StrategyPattern/Planning/strategies/CustomRoundRobinPlanningStrategy.vue -->
<template>
  <div>
    <p class="mb-4 text-gray-600">
      <span class="text-red-500 dark:text-red-600 font-bold">
        <strong>Attention :</strong> Le planning existant sera supprimé et
        remplacé. <br /><br />
      </span>
      L'algorithme 'Custom Round Robin' va répartir équitablement les Pools sur
      les terrains pour que chaque Pool participe au plus de sports différents
      possibles, selon les réglages définis dans le planning. Pour une
      répartition équilibrée, assurez-vous d'avoir suffisamment de terrains et
      de créneaux horaires.
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
      pools: {
        type: Array,
        required: false,
      },
      fields: {
        type: Array,
        required: false,
      },
      planningTourney: {
        type: Object,
        required: false,
      },
    },
    methods: {
      async generatePlanning() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/planning/pools/generate`
          );
          console.log('Response', response);
          toast.success('Planning généré avec succès !', {
            autoClose: 3000,
          });

          return true;
        } catch (error) {
          console.error('Erreur lors de la génération du planning :', error);
          const errorMessage =
            error.response?.data?.message ||
            'Erreur lors de la génération du planning.';
          toast.error(errorMessage);

          return false;
        }
      },
    },
  };
</script>
