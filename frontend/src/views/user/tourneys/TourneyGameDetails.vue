<!-- src/views/user/tourneys/TourneyGameDetails.vue -->
<template>
  <div>
    <!-- Affichage des détails du match -->
    <div>
      <!-- Détails du match -->
    </div>

    <!-- Section de mise à jour des scores (assistants seulement) -->
    <div class="p-6" v-if="isAssistant">
      Bonjour assistant
      <!-- Formulaire de mise à jour des scores -->
    </div>
    <div v-else>
      <p>Bonjour</p>
    </div>
  </div>
</template>

<script>
  export default {
    data() {
      return {};
    },
    computed: {
      isAssistant() {
        return this.$store.getters['userTourney/isAssistant'];
      },
    },
    methods: {},
  };
</script>
