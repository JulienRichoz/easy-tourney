<template>
  <div v-if="userId !== null">
    <ProfilePageComponent :userId="userId" :isAdmin="isAdmin" />
  </div>
  <div v-else>
    <p>Vous avez été déconnecté.</p>
  </div>
</template>

<script>
  import ProfilePageComponent from '@/components/ProfilePageComponent.vue';

  export default {
    components: {
      ProfilePageComponent,
    },
    computed: {
      userId() {
        return this.$store.state.user ? this.$store.state.user.id : null;
      },
      isAdmin() {
        // Vérifier si l'utilisateur est admin en fonction de son roleId
        return this.$store.state.user && this.$store.state.user.roleId === 1;
      },
    },
    watch: {
      userId(newVal) {
        if (newVal === null) {
          // L'utilisateur est déconnecté, rediriger vers la page de login
          this.$router.push('/login');
        }
      },
    },
  };
</script>
