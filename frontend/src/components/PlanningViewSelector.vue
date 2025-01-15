<!-- PlanningViewSelector.vue -->
<!-- Ce composant permet de sélectionner la vue de la planification d'un tournoi. -->
<!-- Il permet de basculer entre les vues "Pools" et "Matchs". -->
<!-- Il est utilisé dans les pages de planification des tournois. -->
<template>
  <div
    class="planning-view-selector my-4 flex items-center justify-center space-x-4"
  >
    <!-- Label visible uniquement sur les écrans sm et plus grands -->
    <span
      class="font-semibold text-light-form-text dark:text-dark-form-text hidden sm:inline"
    >
      Planification des :
    </span>

    <!-- Bouton Radio pour Pools -->
    <label class="flex items-center cursor-pointer">
      <input
        type="radio"
        name="planningView"
        value="pools"
        v-model="currentView"
        @change="navigateTo('pools')"
        class="form-radio h-5 w-5 text-blue-600"
      />
      <span class="ml-2 text-gray-800 dark:text-gray-200">Pools</span>
    </label>

    <!-- Bouton Radio pour Matchs -->
    <label class="flex items-center cursor-pointer">
      <input
        type="radio"
        name="planningView"
        value="games"
        v-model="currentView"
        @change="navigateTo('games')"
        class="form-radio h-5 w-5 text-blue-600"
      />
      <span class="ml-2 text-gray-800 dark:text-gray-200">Matchs</span>
    </label>
  </div>
</template>

<script>
  export default {
    name: 'PlanningViewSelector',
    props: {
      tourneyId: {
        type: [String, Number],
        required: true,
      },
    },
    data() {
      return {
        currentView: this.getCurrentView(),
      };
    },
    methods: {
      // Retourne la vue actuelle en fonction de l'URL
      getCurrentView() {
        if (this.$route.name === 'AdminTourneyPlanningPools') {
          return 'pools';
        } else if (this.$route.name === 'AdminTourneyPlanningGames') {
          return 'games';
        }
        return 'pools'; // Valeur par défaut
      },

      // Navigue vers la vue spécifiée
      navigateTo(view) {
        if (view === 'pools') {
          this.$router.push(`/admin/tourneys/${this.tourneyId}/planning/pools`);
        } else if (view === 'games') {
          this.$router.push(`/admin/tourneys/${this.tourneyId}/planning/games`);
        }
      },
    },

    // Mettre à jour la vue actuelle si l'URL change
    watch: {
      '$route.name'() {
        this.currentView = this.getCurrentView();
      },
    },
  };
</script>

<style scoped>
  .planning-view-selector {
    flex-shrink: 0; /* Pour éviter qu'il ne se réduise dans un espace restreint */
    max-width: 100%; /* Empêche de dépasser le conteneur parent */
  }
</style>
