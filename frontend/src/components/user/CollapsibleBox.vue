<!-- CollapsibleBox.vue -->
<!-- Ce composant affiche des informations utilisateurs en bleu. -->
<!-- Il prend en paramètre un titre. -->
<!-- Lorsqu'on clique sur le titre, le contenu est affiché ou caché. -->
<template>
  <div class="mb-4">
    <button
      @click="isOpen = !isOpen"
      class="w-full flex justify-between items-center bg-blue-500 text-white px-4 py-2 rounded"
    >
      <span>{{ title }}</span>
      <span v-if="isOpen">-</span>
      <span v-else>+</span>
    </button>
    <div v-show="isOpen" class="mt-2 p-4 border rounded">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      title: {
        type: String,
        required: true,
      },
    },
    data() {
      return {
        isOpen: true,
      };
    },
  };
</script>
