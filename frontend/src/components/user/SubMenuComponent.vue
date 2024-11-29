<template>
  <div
    class="tourney-nav w-full z-50 bg-light-subMenu-background dark:bg-dark-subMenu-background shadow-lg border-b border-light-subMenu-border dark:border-dark-subMenu-border"
  >
    <router-link
      v-for="item in menuItems"
      :key="item.name"
      :to="item.route"
      class="tourney-nav-item"
      :class="{ active: $route.name === item.routeName }"
    >
      <font-awesome-icon :icon="item.icon" />
      <span class="hidden sm:inline"> {{ item.label }}</span>
    </router-link>
  </div>
</template>

<script>
  export default {
    props: {
      tourneyId: {
        type: String,
        required: true,
      },
    },
    computed: {
      menuItems() {
        return [
          {
            name: 'planning',
            label: 'Planning',
            icon: ['fas', 'calendar-alt'],
            route: `/tourneys/${this.tourneyId}/planning`,
            routeName: 'UserTourneyPlanning',
          },
          {
            name: 'scores',
            label: 'Scores',
            icon: ['fas', 'list-ol'],
            route: `/tourneys/${this.tourneyId}/scores`,
            routeName: 'UserTourneyScores',
          },
          {
            name: 'statistics',
            label: 'Statistiques',
            icon: ['fas', 'chart-bar'],
            route: `/tourneys/${this.tourneyId}/statistics`,
            routeName: 'UserTourneyStatistics',
          },
          {
            name: 'teams',
            label: 'Équipes',
            icon: ['fas', 'users'],
            route: `/tourneys/${this.tourneyId}/join-team`,
            routeName: 'UserTourneyJoinTeam',
          },
          // Ajoutez d'autres items si nécessaire
        ];
      },
    },
  };
</script>

<style scoped>
  .tourney-nav {
    display: flex;
    background-color: var(--subMenu-background);
    border-bottom: 1px solid var(--subMenu-border);
    margin: 0;
  }

  .tourney-nav-item {
    cursor: pointer;
    font-weight: 600;
    color: var(--subMenu-text);
    padding: 1rem 0;
    text-align: center;
    transition: background-color 0.3s ease-in-out, color 0.3s ease-in-out;
    flex: 1;
    position: relative;
  }

  .tourney-nav-item:hover {
    background-color: var(--subMenu-hoverBackground);
    color: var(--subMenu-hoverText);
  }

  .tourney-nav-item.active {
    color: var(--subMenu-activeText);
    font-weight: bold;
  }

  .tourney-nav-item.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 1%;
    width: 98%;
    height: 4px;
    background-color: var(--subMenu-activeIndicator);
    border-radius: 4px;
  }
</style>
