<template>
  <div>
    <p class="mb-4 text-gray-600">
      Cet algorithme va générer des pools et assigner les équipes du tournoi aux
      pools automatiquement.
      <strong>Attention :</strong> Les pools existantes seront supprimées. Il
      est préférable d'effectuer cette action une fois les inscriptions
      terminées. Vous pourrez ensuite ajuster manuellement si nécessaire.
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
            `/tourneys/${this.tourneyId}/pools/generate`,
            {
              strategy: 'customRoundRobin',
            }
          );

          const { pools } = response.data;
          const poolCount = pools.length;

          toast.success(
            `Pools générées avec succès ! ${poolCount} pools ont été créées.`
          );
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
