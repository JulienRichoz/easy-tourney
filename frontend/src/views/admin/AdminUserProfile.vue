<template>
  <ProfilePageComponent :userId="userId" :isAdmin="true" />
</template>

<script>
  import ProfilePageComponent from '@/components/ProfilePageComponent.vue';

  export default {
    components: {
      ProfilePageComponent,
    },
    computed: {
      userId() {
        return Number(this.$route.params.userId);
      },
    },
  };
</script>
