<!-- components/StrategyPattern/Pool/StrategyPoolGeneratorComponent.vue -->
<template>
  <ModalComponent
    :isVisible="isVisible"
    title="Générer des Pools"
    @close="handleClose"
  >
    <template #content>
      <component
        :is="currentStrategyComponent"
        ref="strategyComponent"
        :tourneyId="tourneyId"
        :teams="teams"
        :pools="pools"
        :availableFields="availableFields"
      ></component>
    </template>
    <template #footer>
      <ButtonComponent variant="secondary" @click="handleClose">
        Annuler
      </ButtonComponent>
      <ButtonComponent variant="primary" @click="generatePools">
        Générer
      </ButtonComponent>
    </template>
  </ModalComponent>
</template>

<script>
  import CustomRoundRobinStrategy from './strategies/CustomRoundRobinStrategy.vue';
  import ModalComponent from '@/components/ModalComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      CustomRoundRobinStrategy,
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
        required: false,
      },
      teams: {
        type: Array,
        required: false,
      },
      pools: {
        type: Array,
        required: false,
      },
      availableFields: {
        type: Number,
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
            return 'CustomRoundRobinStrategy';
          // Ajoutez d'autres cas pour chaque tourneyType
          default:
            return 'CustomRoundRobinStrategy'; // Valeur par défaut
        }
      },
    },
    methods: {
      handleClose() {
        this.$emit('close');
      },
      async generatePools() {
        // Appeler la méthode generatePools du composant enfant
        const result = await this.$refs.strategyComponent.generatePools();
        if (result) {
          this.$emit('poolsGenerated');
          this.handleClose();
        }
      },
    },
  };
</script>
