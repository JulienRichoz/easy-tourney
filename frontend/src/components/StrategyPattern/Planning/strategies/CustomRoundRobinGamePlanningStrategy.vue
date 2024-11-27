<!-- CustomRoundRobinGamePlanningStrategy.vue -->
<template>
  <div>
    <p class="mb-4">
      <span class="text-red-500 dark:text-red-600 font-bold">
        <strong>Attention :</strong> Le planning des matchs existants sera
        supprimé et remplacé.
      </span>
      <br /><br />
      L'algorithme 'Custom Round Robin' va réorganiser les matchs au sein des
      pools existants selon les nouvelles contraintes définies dans le planning.
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
          const response = await apiService.post(
            `/tourneys/${this.tourneyId}/planning/games/generate`,
            {},
            {
              params: {
                randomMode: this.randomMode,
              },
            }
          );
          console.log('Response', response);
          toast.success('Planning des matchs généré avec succès !', {
            autoClose: 3000,
          });

          return true;
        } catch (error) {
          console.error(
            'Erreur lors de la génération du planning des matchs :',
            error
          );
          const errorMessage =
            error.response?.data?.message ||
            'Erreur lors de la génération du planning des matchs.';
          toast.error(errorMessage);

          return false;
        }
      },
    },
  };
</script>

<style scoped></style>
