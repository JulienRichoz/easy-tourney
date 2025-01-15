<!-- src/components/CardAddComponent.vue -->
<!-- Composant pour ajouter un élément dans une liste. -->
<!-- Il affiche une carte avec une icône Plus et un titre. -->
<!-- Lorsqu'on clique dessus, il émet un événement pour ouvrir un modal. -->
<!-- !!! Attention au changement => Utilisé dans de nombreuses pages. !!! -->
<template>
  <!-- Carte avec une icône Plus et un titre -->
  <div
    @click="openAddElementModal"
    class="cursor-pointer bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md flex flex-col items-center justify-center hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground transition-transform transform hover:scale-105 min-h-[150px]"
  >
    <PlusIcon
      class="w-12 h-12 text-light-profileText dark:text-dark-profileText"
    />
    <h2
      class="text-md font-semibold mt-2 text-light-title dark:text-dark-title"
    >
      Ajouter {{ title }}
    </h2>
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
