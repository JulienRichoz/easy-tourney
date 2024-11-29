<!-- src/views/user/tourneys/TourneyPlanning.vue -->
<template>
  <div>
    <SubMenuComponent :tourneyId="tourneyId" />

    <!-- Contenu de la page -->
    <div class="p-6">
      <TitleComponent title="Planning" />
      <!-- Afficher le Planning -->
    </div>
  </div>
</template>

<script>
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';

  export default {
    components: {
      SubMenuComponent,
      TitleComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
      };
    },
    methods: {},
  };
</script>
