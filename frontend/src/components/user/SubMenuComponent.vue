<template>
  <div
    :class="['tourney-nav', isNavVisible ? 'visible' : 'hidden']"
    class="tourney-nav w-full z-50 bg-light-subMenu-background dark:bg-dark-subMenu-background shadow-lg border-b border-light-subMenu-border dark:border-dark-subMenu-border"
  >
    <!-- PLANNING -->
    <router-link
      :to="`/tourneys/${tourneyId}/planning`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{
        active: $route.name === 'UserTourneyPlanning',
      }"
    >
      <font-awesome-icon :icon="['fas', 'calendar-alt']" />
      <span class="hidden sm:inline"> Planning</span>
    </router-link>

    <!-- SCORE -->
    <router-link
      :to="`/tourneys/${tourneyId}/scores`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'UserTourneyScores' }"
    >
      <font-awesome-icon :icon="['fas', 'list-ol']" />
      <span class="hidden sm:inline"> Scores</span>
    </router-link>

    <!-- DETAILS -->
    <router-link
      :to="`tourneys/${tourneyId}/details`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'UserTourneyDetails' }"
    >
      <font-awesome-icon :icon="['fas', 'info-circle']" />
      <span class="hidden sm:inline"> Détails</span>
    </router-link>
  </div>
</template>

<script>
  export default {
    data() {
      return {
        activeTab: 'planning', // Par défaut, on montre les détails du tournoi
        isNavVisible: true, // Défini la visibilité par défaut du menu
      };
    },
    methods: {
      selectTab(tab) {
        this.activeTab = tab;
      },
    },
    props: {
      tourneyId: {
        type: String,
        required: true,
      },
    },
  };
</script>

<style scoped>
  .tourney-nav {
    display: flex;
    background-color: white; /* Un gris très léger pour tout le fond du sous-menu */
    border-bottom: 1px solid #e2e8f0;
    margin: 0; /* Coller au menu principal */
  }

  .tourney-nav-item {
    cursor: pointer;
    font-weight: 600;
    color: #4a5568; /* Couleur gris foncé pour un bon contraste */
    padding: 1.5rem 0; /* Plus de padding pour agrandir la zone cliquable */
    text-align: center;
    transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
    flex: 1; /* Chaque item occupe 25% de la largeur */
    position: relative;
  }

  .tourney-nav-item:hover {
    background-color: #e2e8f0; /* Un gris légèrement plus foncé au hover */
    color: #2f855a; /* Vert plus foncé au survol pour l’interaction */
  }

  .tourney-nav-item.active {
    color: #2f855a; /* Vert pour indiquer que l’élément est actif */
    font-weight: bold;
  }
  .tourney-nav-item div {
    position: relative;
  }

  .tourney-nav-item.active::after {
    content: '';
    position: absolute;
    bottom: 0; /* Barre verte en bas de l'élément */
    left: 1%; /* La barre occupe le quart de la largeur de l'élément */
    width: 98%; /* Barre qui prend environ 75% de la largeur de l'item */
    height: 4px;
    background-color: #38a169; /* Couleur verte élégante pour indiquer l'onglet actif */
    border-radius: 4px; /* Barre arrondie pour plus de fluidité */
  }
</style>
