<!-- StrategyPlanningGeneratorComponent.vue -->
<template>
  <ModalComponent
    :isVisible="isVisible"
    title="Générer le Planning"
    @close="handleClose"
  >
    <template #content>
      <div class="mb-4">
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="localRandomMode"
            class="form-checkbox h-5 w-5 text-blue-600"
          />
          <span class="text-gray-700 dark:text-gray-300">
            Génération aléatoire (erreurs plus probables)
          </span>
        </label>
      </div>
      <p>
        Mode sélectionné :
        <strong>{{ localRandomMode ? 'Aléatoire' : 'Standard' }}</strong>
      </p>
      <component
        :is="currentStrategyComponent"
        ref="strategyComponent"
        :tourneyId="tourneyId"
        :pools="pools"
        :fields="fields"
        :planningTourney="planningTourney"
        :randomMode="localRandomMode"
      ></component>
    </template>
    <template #footer>
      <ButtonComponent variant="secondary" @click="handleClose">
        Annuler
      </ButtonComponent>
      <ButtonComponent
        :disabled="isGenerating"
        variant="primary"
        @click="generatePlanning"
      >
        {{ isGenerating ? 'Génération...' : 'Générer' }}
      </ButtonComponent>
    </template>
  </ModalComponent>
</template>

<script>
  import CustomRoundRobinPoolPlanningStrategy from './strategies/CustomRoundRobinPoolPlanningStrategy.vue';
  import CustomRoundRobinGamePlanningStrategy from './strategies/CustomRoundRobinGamePlanningStrategy.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      CustomRoundRobinPoolPlanningStrategy,
      CustomRoundRobinGamePlanningStrategy,
      ModalComponent,
      ButtonComponent,
    },
    props: {
      tourneyId: {
        type: String,
        required: true,
      },
      tourneyType: {
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
      isVisible: {
        type: Boolean,
        default: true,
      },
      randomMode: {
        type: Boolean,
        default: false,
      },
      planningType: {
        type: String,
        required: true, // 'pool' ou 'game'
      },
    },
    data() {
      return {
        localRandomMode: this.randomMode,
        isGenerating: false, // Nouvel état pour gérer le clic
      };
    },
    computed: {
      currentStrategyComponent() {
        if (this.planningType === 'pool') {
          return 'CustomRoundRobinPoolPlanningStrategy';
        } else if (this.planningType === 'game') {
          return 'CustomRoundRobinGamePlanningStrategy';
        } else {
          // Valeur par défaut ou gestion d'erreur
          return 'CustomRoundRobinPoolPlanningStrategy';
        }
      },
    },
    methods: {
      handleClose() {
        this.$emit('close');
      },
      async generatePlanning() {
        if (this.isGenerating) return; // Empêche les clics multiples
        this.isGenerating = true;

        try {
          // Fermer la modale immédiatement
          this.handleClose();

          // Appeler la méthode de la stratégie sélectionnée
          const result = await this.$refs.strategyComponent.generatePlanning();

          if (result) {
            this.$emit('planningGenerated');
          }
        } catch (error) {
          console.error('Erreur lors de la génération du planning :', error);
        } finally {
          this.isGenerating = false; // Réinitialiser l'état
        }
      },
    },
  };
</script>

<style scoped></style>
