<!-- TourneyTeamDetailsUser.vue -->
<template>
  <div class="p-6">
    <div v-if="team">
      <TitleComponent :title="team.teamName" />

      <div class="mt-4">
        <h2 class="text-xl font-semibold">Membres de l'équipe :</h2>
        <ul class="mt-2">
          <li
            v-for="userTourney in team.usersTourneys"
            :key="userTourney.userId"
            class="flex items-center justify-between p-2 border-b"
          >
            <div>
              <p class="font-medium">{{ userTourney.user.name }}</p>
              <p class="text-sm text-gray-600">{{ userTourney.user.email }}</p>
            </div>
          </li>
        </ul>
      </div>
      <ButtonComponent @click="goBack" variant="secondary" class="mt-4">
        Retour
      </ButtonComponent>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import TitleComponent from '@/components/TitleComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      TitleComponent,
      ButtonComponent,
    },
    data() {
      return {
        tourneyId: this.$route.params.id,
        teamId: this.$route.params.teamId,
        team: null,
      };
    },
    methods: {
      async fetchTeamDetails() {
        try {
          const response = await apiService.get(
            `/tourneys/${this.tourneyId}/teams/${this.teamId}`
          );
          this.team = response.data;
        } catch (error) {
          console.error(
            "Erreur lors de la récupération des détails de l'équipe:",
            error
          );
          toast.error(
            "Erreur lors de la récupération des détails de l'équipe."
          );
        }
      },
      goBack() {
        this.$router.go(-1);
      },
    },
    mounted() {
      this.fetchTeamDetails();
    },
  };
</script>

<style scoped>
  /* Styles personnalisés */
</style>
