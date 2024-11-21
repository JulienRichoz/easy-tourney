<!-- components/StrategyPattern/Planning/StrategyPlanningGeneratorComponent.vue -->
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
          <span class="text-gray-700 dark:text-gray-300"
            >Génération aléatoire</span
          >
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
      <ButtonComponent variant="primary" @click="generatePlanning">
        Générer
      </ButtonComponent>
    </template>
  </ModalComponent>
</template>

<script>
  import CustomRoundRobinPlanningStrategy from './strategies/CustomRoundRobinPlanningStrategy.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      CustomRoundRobinPlanningStrategy,
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
    },
    data() {
      return {
        localRandomMode: this.randomMode,
      };
    },
    computed: {
      currentStrategyComponent() {
        switch (this.tourneyType) {
          case 'customRoundRobin':
            return 'CustomRoundRobinPlanningStrategy';
          default:
            return 'CustomRoundRobinPlanningStrategy';
        }
      },
    },
    methods: {
      handleClose() {
        this.$emit('close');
      },
      async generatePlanning() {
        const result = await this.$refs.strategyComponent.generatePlanning();
        if (result) {
          this.$emit('planningGenerated');
          this.handleClose();
        }
      },
    },
  };
</script>

<style scoped></style>
