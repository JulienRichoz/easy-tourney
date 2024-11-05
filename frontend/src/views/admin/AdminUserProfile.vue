<template>
  <div v-if="userId !== null">
    <ProfilePageComponent :userId="userId" :isAdmin="true" />
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
        const id = this.$route.params.userId;
        const userId = id ? Number(id) : null;
        if (isNaN(userId)) {
          return null;
        }
        return userId;
      },
    },
  };
</script>
