<!-- src/views/user/tourneys/TourneyScores.vue -->
<template>
  <div>
    <SubMenuComponent :tourneyId="tourneyId" />

    <div class="p-6">
      <TitleComponent title="Scores du Tournoi" />
      <!-- Afficher les scores -->
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
      // Fetch des scores
    },
  };
</script>
