<!-- components/StrategyPattern/Planning/strategies/CustomRoundRobinPlanningStrategy.vue -->
<template>
  <div>
    <p class="mb-4 text-gray-600">
      Cet algorithme va générer le planning des Pools automatiquement en
      respectant la configuration du tournoi.
      <br />
      <strong>Attention :</strong> Les plannings existants seront supprimés. Il
      est préférable d'effectuer cette action une fois les Pools générées.
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
        required: true,
      },
      fields: {
        type: Array,
        required: true,
      },
      planningTourney: {
        type: Object,
        required: true,
      },
    },
    methods: {
      async generatePlanning() {
        try {
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/planning/generate`,
            {
              strategy: 'customRoundRobin',
            }
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
