<!-- src/views/user/tourneys/TourneyStatistics.vue -->
<template>
  <div>
    <SubMenuComponent :tourneyId="tourneyId" />

    <div class="p-6">
      <TitleComponent title="Statistiques du Tournoi" />
      <!-- Afficher les statistiques -->
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
    mounted() {
      // Fetch des statistiques
    },
  };
</script>
