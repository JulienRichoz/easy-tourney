<!-- components/StrategyPattern/Planning/StrategyPlanningGeneratorComponent.vue -->
<template>
  <ModalComponent
    :isVisible="isVisible"
    title="Générer le Planning"
    @close="handleClose"
  >
    <template #content>
      <component
        :is="currentStrategyComponent"
        ref="strategyComponent"
        :tourneyId="tourneyId"
        :pools="pools"
        :fields="fields"
        :planningTourney="planningTourney"
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
    },
    computed: {
      currentStrategyComponent() {
        switch (this.tourneyType) {
          case 'customRoundRobin':
            return 'CustomRoundRobinPlanningStrategy';
          // Ajoutez d'autres cas pour chaque stratégie
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
        // Appeler la méthode generatePlanning du composant enfant
        const result = await this.$refs.strategyComponent.generatePlanning();
        if (result) {
          this.$emit('planningGenerated');
          this.handleClose();
        }
      },
    },
  };
</script>
