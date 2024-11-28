<!-- TourneySubMenu(Component).vue -->

<template>
  <div
    :class="['tourney-nav', isNavVisible ? 'visible' : 'hidden']"
    class="tourney-nav w-full z-50 bg-light-subMenu-background dark:bg-dark-subMenu-background shadow-lg border-b border-light-subMenu-border dark:border-dark-subMenu-border"
  >
    <!-- Liens du menu -->
    <!-- DETAILS -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'AdminTourneyDetails' }"
    >
      <font-awesome-icon :icon="['fas', 'info-circle']" />

      <span class="hidden sm:inline"> Détails</span>
    </router-link>

    <!-- TERRAINS -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}/fields`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'AdminTourneyFieldsManagement' }"
    >
      <font-awesome-icon :icon="['fas', 'map']" />
      <span class="hidden sm:inline"> Terrains</span>
    </router-link>

    <!-- ASSIGNATION SPORTS AUX TERRAINS -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}/sports-fields`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'AdminTourneySportsFields' }"
    >
      <font-awesome-icon :icon="['fas', 'futbol']" />
      <span class="hidden sm:inline"> Assignation</span>
    </router-link>

    <!-- INSCRIPTIONS ET GESTION DES EQUIPES -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}/teams`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'AdminTourneyTeams' }"
    >
      <font-awesome-icon :icon="['fas', 'user']" />
      <span class="hidden sm:inline"> Inscriptions</span>
    </router-link>

    <!-- POOLS -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}/pools`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{ active: $route.name === 'AdminTourneyPools' }"
    >
      <font-awesome-icon :icon="['fas', 'users']" />
      <span class="hidden sm:inline"> Pools</span>
    </router-link>

    <!-- PLANNING -->
    <router-link
      :to="`/admin/tourneys/${tourneyId}/planning/${currentPlanningStatus}`"
      class="tourney-nav-item text-light-subMenu-text dark:text-dark-subMenu-text hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground hover:text-light-subMenu-hoverText dark:hover:text-dark-subMenu-hoverText"
      :class="{
        active:
          $route.name === 'AdminTourneyPlanningPools' ||
          $route.name === 'AdminTourneyPlanningGames' ||
          $route.name === 'AdminTourneyPlanningCompleted',
      }"
    >
      <font-awesome-icon :icon="['fas', 'calendar-alt']" />
      <span class="hidden sm:inline"> Planning</span>
    </router-link>
  </div>
</template>

<script>
  import { mapState } from 'vuex';

  export default {
    data() {
      return {
        activeTab: 'details', // Par défaut, on montre les détails du tournoi
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
    computed: {
      ...mapState('tourney', ['statuses']),
      currentPlanningStatus() {
        if (this.statuses.planningStatus === 'completed') {
          return 'games/details';
        }
        if (this.statuses.planningStatus !== 'notStarted') {
          return 'pools';
        }
        return this.statuses.planningStatus || 'pools'; // Valeur par défaut
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
