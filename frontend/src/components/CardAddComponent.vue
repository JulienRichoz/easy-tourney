<template>
  <!-- Carte pour ajouter un nouveau tournoi -->
  <div
    @click="openAddElementModal"
    class="cursor-pointer bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-gray-50 transition-transform transform hover:scale-105 h-72"
  >
    <PlusIcon class="w-14 h-14 text-green-500" />
    <h2 class="text-lg font-semibold mt-4">Ajouter {{ title }}</h2>
  </div>
</template>

<script>
  import { PlusIcon } from '@heroicons/vue/24/outline';

  export default {
    components: {
      PlusIcon,
    },
    props: {
      title: {
        type: String,
        required: true,
        default: '',
      },
    },
    methods: {
      openAddElementModal() {
        this.$emit('openAddElementModal');
      },
    },
  };
</script>
