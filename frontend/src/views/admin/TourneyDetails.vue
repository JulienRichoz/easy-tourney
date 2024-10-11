<template>
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-4">{{ tourney.name }}</h1>
      <p class="text-lg mb-4">Lieu: {{ tourney.location }}</p>
      <p class="text-lg mb-4">Date: {{ tourney.dateTourney }}</p>
  
      <div class="flex items-center space-x-4 mt-6">
        <button
          @click="navigateToGroupSetup"
          class="bg-blue-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-600"
        >
          Configurer les Groupes
        </button>
        <button
          @click="navigateToSchedule"
          class="bg-green-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-green-600"
        >
          Gérer le Planning
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import apiService from "@/services/apiService";
  
  export default {
    data() {
      return {
        tourney: {},
      };
    },
    methods: {
      async fetchTourneyDetails() {
        try {
          const response = await apiService.get(`/tourneys/${this.$route.params.id}`);
          this.tourney = response.data;
        } catch (error) {
          console.error("Erreur lors de la récupération des détails du tournoi:", error);
        }
      },
      navigateToGroupSetup() {
        // Navigation logique pour configurer les groupes
      },
      navigateToSchedule() {
        // Navigation logique pour gérer le planning
      },
    },
    mounted() {
      this.fetchTourneyDetails();
    },
  };
  </script>
  
  <style scoped>
  button {
    transition: transform 0.2s ease;
  }
  
  button:hover {
    transform: scale(1.05);
  }
  </style>
  