<!-- components/StrategyPattern/Pool/strategies/CustomRoundRobinStrategy.vue -->
<template>
  <div>
    <p class="mb-4 text-gray-600">
      Cet algorithme va générer des pools et assigner les équipes du tournoi aux
      pools automatiquement.
      <strong>Attention :</strong> Les pools existantes seront supprimées. Il
      est préférable d'effectuer cette action une fois les inscriptions
      terminées. Vous pourrez ensuite ajuster manuellement si nécessaire.
    </p>
    <div class="flex flex-col mb-4">
      <label for="poolCount" class="text-sm font-medium text-gray-700 mb-2">
        Nombre de Pools :
      </label>
      <input
        type="number"
        v-model="poolCount"
        :placeholder="`Nombre optimal : ${availableFields}`"
        min="1"
        :max="Math.ceil(availableFields * 1.5)"
        class="input-style border border-gray-300 rounded-md p-2"
      />
    </div>
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
    data() {
      return {
        poolCount: null,
      };
    },
    methods: {
      async generatePools() {
        if (!this.poolCount || this.poolCount < 1) {
          toast.error('Veuillez entrer un nombre valide de pools.');
          return false;
        }

        try {
          await apiService.post(`/tourneys/${this.tourneyId}/pools/generate`, {
            poolCount: this.poolCount,
            strategy: 'customRoundRobin',
          });

          toast.success('Pools générés avec succès !');
          return true;
        } catch (error) {
          console.error('Erreur lors de la génération des pools :', error);
          toast.error('Erreur lors de la génération des pools.');
          return false;
        }
      },
    },
  };
</script>
