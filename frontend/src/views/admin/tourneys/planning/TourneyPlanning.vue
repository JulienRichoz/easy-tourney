<!-- TourneyPools.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />
  </div>
  <div class="p-6">
    <div class="flex items-center mb-8 justify-between">
      <div class="flex items-center">
        <TitleComponent title="Planning"></TitleComponent>
      </div>
      En développement
    </div>
    En développement
  </div>
</template>

<script>
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import TitleComponent from '@/components/TitleComponent.vue';

  export default {
    components: {
      TourneySubMenu,
      TitleComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
      };
    },
  };
</script>
