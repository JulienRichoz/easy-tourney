<template>
  <div
    class="cursor-pointer bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-transform transform hover:scale-105 flex flex-col justify-between h-auto min-h-[200px]"
    @click="onClick"
  >
    <!-- Si une image est présente, on réduit la hauteur -->
    <img
      v-if="image"
      :src="image"
      class="w-full h-28 object-cover mb-4 rounded-lg"
    />

    <!-- Titre et sous-titre -->
    <div>
      <h2
        class="text-2xl font-semibold mb-4 truncate"
        :style="{ color: titleColor, textShadow: '0 0 1px black' }"
      >
        {{ title }}
      </h2>
      <p v-if="subtitle" class="text-gray-500">{{ subtitle }}</p>

      <!-- Lieu et date -->
      <div
        class="flex items-center text-gray-600 mb-1 truncate"
        v-if="location"
      >
        <MapPinIcon class="w-5 h-5 mr-1" />
        <p>{{ location }}</p>
      </div>
      <div class="flex items-center text-gray-600 mb-3 truncate" v-if="date">
        <CalendarDaysIcon class="w-5 h-5 mr-1" />
        <p>{{ date }}</p>
      </div>

      <!-- Badge de statut -->
      <span
        v-if="status"
        :class="statusClass"
        class="inline-block px-3 py-1 rounded-full text-white font-semibold text-sm"
      >
        {{ status }}
      </span>
    </div>

    <!-- Zone des boutons d'action -->
    <div v-if="hasActions" class="flex justify-between mt-4 w-full">
      <ButtonComponent
        v-if="showDeleteButton"
        variant="danger"
        icon="TrashIcon"
        @click.stop="onDelete"
      />
      <ButtonComponent
        v-if="showEditButton"
        variant="warning"
        icon="PencilIcon"
        @click.stop="onEdit"
      />
    </div>
  </div>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';
  import { MapPinIcon, CalendarDaysIcon } from '@heroicons/vue/24/outline';

  export default {
    components: {
      ButtonComponent,
      MapPinIcon,
      CalendarDaysIcon,
    },
    props: {
      title: {
        type: String,
        required: true,
      },
      subtitle: {
        type: String,
        default: '',
      },
      image: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        default: null,
      },
      location: {
        type: String,
        default: null,
      },
      date: {
        type: String,
        default: null,
      },
      titleColor: {
        type: String,
        default: 'text-gray-600', // Couleur du titre par défaut, si aucun n'est passé
      },
      showDeleteButton: {
        type: Boolean,
        default: false,
      },
      showEditButton: {
        type: Boolean,
        default: false,
      },
      hasActions: {
        type: Boolean,
        default: true,
      },
    },
    computed: {
      statusClass() {
        switch (this.status) {
          case 'draft':
            return 'bg-red-300 text-red-500';
          case 'ready':
            return 'bg-yellow-300 text-yellow-500';
          case 'active':
            return 'bg-blue-300 text-blue-500';
          default:
            return 'bg-gray-300 text-gray-500';
        }
      },
    },
    methods: {
      onDelete(event) {
        this.$emit('delete', event);
      },
      onEdit(event) {
        this.$emit('edit', event);
      },
      onClick(event) {
        this.$emit('click', event); // Assurez-vous que cet événement gère l'ouverture de la modale d'édition
      },
    },
  };
</script>
