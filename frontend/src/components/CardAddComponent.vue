<template>
  <div
    @click="openAddElementModal"
    class="cursor-pointer bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-gray-50 transition-transform transform hover:scale-105 min-h-[150px]"
  >
    <PlusIcon class="w-12 h-12 text-green-500" />
    <h2 class="text-md font-semibold mt-2">Ajouter {{ title }}</h2>
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
      },
    },
    methods: {
      openAddElementModal() {
        this.$emit('openAddElementModal');
      },
    },
  };
</script>
