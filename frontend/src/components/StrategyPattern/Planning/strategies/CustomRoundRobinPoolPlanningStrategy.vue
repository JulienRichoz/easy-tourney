<!-- CustomRoundRobinPoolPlanningStrategy.vue -->
<template>
  <div>
    <p class="mb-4">
      <span class="text-red-500 dark:text-red-600 font-bold">
        <strong>Attention :</strong> Le planning des pools existantes sera
        supprimé et remplacé.
      </span>
      <br /><br />
      L'algorithme 'Custom Round Robin' va répartir équitablement les équipes
      dans les pools selon les réglages définis dans le planning. Assurez-vous
      d'avoir suffisamment d'équipes et de créneaux horaires.
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
      randomMode: {
        type: Boolean,
        default: false,
      },
    },
    methods: {
      async generatePlanning() {
        try {
          await apiService.post(
            `/tourneys/${this.tourneyId}/planning/pools/generate`,
            {},
            {
              params: {
                randomMode: this.randomMode,
              },
            }
          );
          toast.success('Planning des pools généré avec succès !', {
            autoClose: 3000,
          });

          return true;
        } catch (error) {
          console.error(
            'Erreur lors de la génération du planning des pools :',
            error
          );
          const errorMessage =
            error.response?.data?.message ||
            'Erreur lors de la génération du planning des pools.';
          toast.error(errorMessage);

          return false;
        }
      },
    },
  };
</script>

<style scoped></style>
