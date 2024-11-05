<template>
  <ProfilePageComponent :userId="userId" :isAdmin="false" />
</template>

<script>
  import ProfilePageComponent from '@/components/ProfilePageComponent.vue';

  export default {
    components: {
      ProfilePageComponent,
    },
    computed: {
      userId() {
        return this.$store.state.user.id;
      },
    },
  };
</script>
