<template>
  <div
    v-if="isVisible"
    class="fixed inset-0 bg-light-modal-background dark:bg-dark-modal-background flex items-center justify-center"
  >
    <div
      class="bg-light-modal-content dark:bg-dark-modal-content p-8 rounded-lg w-full max-w-md max-h-screen overflow-y-auto"
    >
      <slot name="header">
        <h2
          class="text-2xl font-bold mb-4 text-light-title dark:text-dark-title"
        >
          {{ title }}
        </h2>
      </slot>
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      isVisible: {
        type: Boolean,
        required: true,
      },
      title: {
        type: String,
        default: '',
      },
    },
    methods: {
      close() {
        this.$emit('close');
      },
    },
  };
</script>

<style scoped>
  /* Styles gérés par Tailwind CSS */
</style>
