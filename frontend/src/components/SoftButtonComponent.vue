<!-- SoftButtonComponent.vue -->
<!-- Ce composant affiche un bouton avec une icône. -->
<!-- Il prend en paramètre une icône, une couleur, une taille et un état désactivé. -->
<!-- Il peut afficher une icône FontAwesome ou HeroIcons. -->
<!-- Lorsqu'on clique dessus, il émet un événement. -->

<template>
  <span
    :class="[
      'inline-flex items-center justify-center cursor-pointer transition-opacity',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
    ]"
    :style="{ color: iconColor, fontSize: iconSize }"
    @click="!disabled && handleClick"
    role="button"
    :aria-label="ariaLabel"
  >
    <font-awesome-icon
      v-if="fontAwesomeIcon"
      :icon="['fas', fontAwesomeIcon]"
      :class="iconClass"
    />
    <component v-if="heroIcon" :is="icons[heroIcon]" :class="iconClass" />
  </span>
</template>

<script>
  import { TrashIcon, PencilIcon } from '@heroicons/vue/24/outline';

  export default {
    props: {
      heroIcon: {
        type: String,
        default: null, // Utilisé pour HeroIcons
      },
      fontAwesomeIcon: {
        type: String,
        default: null, // Utilisé pour FontAwesome
      },
      iconColor: {
        type: String,
        default: 'currentColor',
      },
      iconSize: {
        type: String,
        default: '1em',
      },
      iconClass: {
        type: String,
        default: 'w-5 h-5',
      },
      ariaLabel: {
        type: String,
        default: '',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        icons: {
          TrashIcon,
          PencilIcon,
        },
      };
    },
    methods: {
      handleClick() {
        this.$emit('click');
      },
    },
  };
</script>
