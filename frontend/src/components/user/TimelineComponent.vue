<!-- components/user/TimelineComponent.vue -->
<!-- Affiche une timeline lors d'un match détail -->
<!-- Il prend en paramètre la position du composant et l'icône à afficher -->
<!-- Il affiche un cercle coloré avec une icône et un contenu -->
<!-- Le contenu est centré, aligné à gauche ou à droite -->
<!-- Le cercle est positionné au centre du contenu -->

<template>
  <li class="relative flex items-center">
    <div
      :class="{
        'ml-auto': position === 'left',
        'mr-auto': position === 'right',
        'mx-auto': position === 'center',
      }"
      class="timeline-box bg-gray-100 p-4 rounded-lg shadow w-60 text-center"
    >
      <slot></slot>
    </div>
    <div class="absolute inset-x-0 flex justify-center">
      <div
        :class="{
          'bg-yellow-500': icon === 'yellow_card',
          'bg-red-500': icon === 'red_card',
          'bg-blue-500': icon === 'goal',
          'bg-gray-500': icon === 'default',
        }"
        class="rounded-full w-10 h-10 flex items-center justify-center text-white text-lg shadow-lg"
      >
        <font-awesome-icon :icon="getIcon(icon)" />
      </div>
    </div>
  </li>
</template>

<script>
  export default {
    props: {
      position: {
        type: String,
        default: 'center', // 'left', 'right', or 'center'
      },
      icon: {
        type: String,
        default: 'default', // e.g., 'yellow_card', 'red_card', 'goal'
      },
    },
    methods: {
      getIcon(iconType) {
        switch (iconType) {
          case 'goal':
            return ['fas', 'futbol'];
          case 'yellow_card':
            return ['fas', 'square'];
          case 'red_card':
            return ['fas', 'square-full'];
          default:
            return ['fas', 'question-circle'];
        }
      },
    },
  };
</script>

<style scoped>
  .timeline-box {
    position: relative;
    z-index: 10;
  }

  .timeline-box::before {
    content: '';
    position: absolute;
    height: 2px;
    background: #e5e7eb; /* Tailwind's gray-200 */
    top: 50%;
    left: -30px;
    right: -30px;
    z-index: -1;
  }
</style>
