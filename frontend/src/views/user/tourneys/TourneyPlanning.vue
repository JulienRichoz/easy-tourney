<!-- src/views/user/tourneys/TourneyPlanning.vue -->
<template>
  <div>
    <SubMenuComponent :tourneyId="tourneyId" />

    <!-- Contenu de la page -->
    <div class="p-6">
      <!-- Afficher le planning -->
    </div>
  </div>
</template>

<script>
  import SubMenuComponent from '@/components/user/SubMenuComponent.vue';

  export default {
    components: {
      SubMenuComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
      };
    },
  };
</script>
