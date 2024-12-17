<!-- src/views/user/UserTourneys.vue -->
<template>
  <div class="p-6">
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
    >
      <!-- Titre de la page -->
      <TitleComponent title="Mes tournois" />

      <!-- Filtres -->
      <div class="flex flex-wrap items-center gap-4 sm:gap-8 mt-4 sm:mt-0">
        <FilterComponent
          :filters="filters"
          @filter-change="handleFilterChange"
        />
      </div>
    </div>

    <!-- Grille des tournois -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <!-- Cartes des tournois existants -->
      <CardEditComponent
        v-for="tourney in filteredTourneys"
        :key="tourney.id"
        :title="tourney.name"
        :location="tourney.location"
        :date="tourney.dateTourney"
        :status="tourney.status"
        :registration-status="tourney.registrationStatus"
        :title-color="getTitleColor(tourney)"
        @click="viewTourneyDetails(tourney)"
      >
        <template #button-actions>
          <ButtonComponent
            v-if="tourney.status !== 'draft'"
            variant="primary"
            fontAwesomeIcon="info-circle"
            @click.stop="goToInfo(tourney)"
          >
            Infos
          </ButtonComponent>
        </template>
      </CardEditComponent>
    </div>
  </div>
</template>

<script>
  import apiService from '@/services/apiService';
  import CardEditComponent from '@/components/CardEditComponent.vue';
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import TitleComponent from '@/components/TitleComponent.vue';
  import FilterComponent from '@/components/FilterComponent.vue';
  import { toast } from 'vue3-toastify';

  export default {
    components: {
      CardEditComponent,
      TitleComponent,
      FilterComponent,
      ButtonComponent,
    },
    data() {
      return {
        userTourneys: [],
        filterStatus: '',
        filterDate: '',
        filters: [
          {
            label: 'Filtrer par statut',
            value: this.filterStatus || '',
            placeholder: 'Tous les statuts',
            options: [
              { label: 'Tous les statuts', value: '' },
              { label: 'Brouillon', value: 'draft' },
              { label: 'Prêt', value: 'ready' },
              { label: 'En cours', value: 'active' },
              { label: 'Terminé', value: 'completed' },
            ],
          },
          {
            label: 'Filtrer par date',
            value: this.filterDate || '',
            options: [
              { label: 'Toutes les dates', value: '' },
              { label: 'À venir', value: 'upcoming' },
              { label: 'Passés', value: 'past' },
            ],
          },
        ],
      };
    },
    computed: {
      filteredTourneys() {
        return this.userTourneys.filter((tourney) => {
          const statusMatches = this.filterStatus
            ? tourney.status === this.filterStatus
            : true;
          const dateMatches =
            this.filterDate === 'upcoming'
              ? new Date(tourney.dateTourney) >= new Date()
              : this.filterDate === 'past'
              ? new Date(tourney.dateTourney) < new Date()
              : true;
          return statusMatches && dateMatches;
        });
      },
    },
    methods: {
      async fetchUserTourneys() {
        const userId = this.$store.state.user.id;
        try {
          let response;
          if (this.isAdmin()) {
            // S'il est admin global, récupérer tous les tournois
            response = await apiService.get('/tourneys');
          } else {
            // Sinon, récupérer uniquement les tournois de l'utilisateur
            response = await apiService.get(`/users/${userId}/tourneys`);
          }
          this.userTourneys = response.data;

          // Sauvegarder les tournois dans le localStorage
          localStorage.setItem(
            'userTourneys',
            JSON.stringify(this.userTourneys)
          );
        } catch (error) {
          console.error('Erreur lors de la récupération des tournois:', error);
          toast.error('Erreur lors de la récupération des tournois!');

          // Charger les données du localStorage en mode hors ligne
          if (!navigator.onLine) {
            const storedTourneys = localStorage.getItem('userTourneys');
            if (storedTourneys) {
              this.userTourneys = JSON.parse(storedTourneys);
            } else {
              console.warn('Aucun tournoi trouvé en cache local.');
            }
          }
        }
      },
      isAdmin() {
        return this.$store.state.user?.roleId === 1;
      },
      handleFilterChange(filter) {
        // Mettre à jour les filtres sélectionnés
        if (filter.label === 'Filtrer par statut') {
          this.filterStatus = filter.value;
        } else if (filter.label === 'Filtrer par date') {
          this.filterDate = filter.value;
        }
      },
      getTitleColor(tourney) {
        if (tourney.status === 'active') {
          return '#48bb78'; // Vert pour 'active'
        } else if (tourney.status === 'completed') {
          return '#a0aec0'; // Gris pour 'completed'
        } else {
          if (tourney.registrationStatus === 'active') {
            return '#ed8936'; // Orange pour inscriptions ouvertes
          } else if (
            tourney.registrationStatus === 'notStarted' ||
            tourney.registrationStatus === 'completed'
          ) {
            return '#f56565'; // Rouge pour inscriptions fermées
          } else {
            return '#4299e1'; // Bleu par défaut
          }
        }
      },
      goToInfo(tourney) {
        this.$router.push(`/tourneys/${tourney.id}/infos`);
      },

      viewTourneyDetails(tourney) {
        if (!this.isCardClickable(tourney)) {
          return; // Ne pas rediriger si la carte n'est pas cliquable
        }

        // Priorité sur le statut du tournoi
        if (
          tourney.status === 'active' ||
          tourney.status === 'completed' ||
          this.isAdmin()
        ) {
          // Rediriger vers 'planning'
          this.$router.push(`/tourneys/${tourney.id}/planning`);
        } else if (
          tourney.registrationStatus === 'active' ||
          tourney.registrationStatus === 'completed'
        ) {
          // Rediriger vers 'join-team'
          this.$router.push(`/tourneys/${tourney.id}/join-team`);
        } else {
          return; // Ne pas rediriger si le statut est inconnu
        }
      },
      isCardClickable(tourney) {
        if (this.isAdmin()) {
          return true; // Toujours cliquable pour un administrateur
        }
        // Si les inscriptions sont fermées et le tournoi n'est ni actif ni terminé
        if (
          (tourney.registrationStatus === 'draft' ||
            tourney.registrationStatus === 'notStarted') &&
          tourney.status !== 'active' &&
          tourney.status !== 'completed'
        ) {
          return false; // Ne pas permettre le clic
        }
        return true; // Permettre le clic
      },
    },
    mounted() {
      this.fetchUserTourneys();
    },
  };
</script>

<style scoped>
  /* Ajouter des styles personnalisés si nécessaire */
</style>
