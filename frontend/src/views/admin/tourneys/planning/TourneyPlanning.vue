<!-- TourneyPools.vue -->
<template>
  <div>
    <!-- Sous-menu du tournoi -->
    <TourneySubMenu :tourneyId="tourneyId" />
  </div>
  <div>
    <h1 class="text-2xl font-bold mb-4">Planning des Pools</h1>
    <div v-if="pools.length" class="space-y-4">
      <div
        v-for="pool in pools"
        :key="pool.id"
        class="bg-white shadow rounded-lg p-4"
      >
        <h2 class="text-lg font-semibold mb-2">{{ pool.name }}</h2>
        <div v-if="pool.schedules.length">
          <ul>
            <li
              v-for="schedule in pool.schedules"
              :key="schedule.id"
              class="flex justify-between items-center"
            >
              <span>{{ schedule.field.name }}</span>
              <span>{{ schedule.startTime }} - {{ schedule.endTime }}</span>
              <span>{{ schedule.date }}</span>
            </li>
          </ul>
        </div>
        <p v-else class="text-gray-500">Aucune planification assignée.</p>
      </div>
    </div>
    <p v-else class="text-gray-500">Aucune pool disponible.</p>
  </div>
</template>

<script>
  import TourneySubMenu from '@/components/TourneySubMenu.vue';
  import apiService from '@/services/apiService';

  export default {
    components: {
      TourneySubMenu,
    },
    data() {
      return {
        tourneyId: this.$route.params.tourneyId,
        pools: [],
      };
    },
    methods: {
      async fetchPlanningDetails() {
        try {
          const response = await apiService.get(`/tourneys/1/planning/details`);
          this.pools = response.data.pools;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des plannings :',
            error
          );
        }
      },
    },
    async mounted() {
      await this.fetchPlanningDetails();
    },
  };
</script>

<style scoped>
  h1 {
    color: #4a4a4a;
  }
</style>
