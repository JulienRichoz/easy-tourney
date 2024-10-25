<!-- src/components/CardEditComponent.vue -->
<template>
  <div
    class="cursor-pointer bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-md hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground transition-transform transform hover:scale-105 flex flex-col justify-between h-auto min-h-[200px]"
    @click="$emit('click')"
  >
    <!-- Affiche le compteur en haut à droite s'il est fourni -->
    <div
      v-if="cornerCount"
      class="absolute top-2 right-2 text-xs font-semibold text-gray-500"
    >
      {{ cornerCount }}
    </div>
    <img
      v-if="image"
      :src="image"
      class="w-full h-28 object-cover mb-4 rounded-lg"
    />

    <!-- Vignette colorée à côté du titre -->
    <div class="flex items-center mb-4">
      <span
        v-if="titleColor"
        class="w-4 h-4 rounded-full mr-2"
        :style="{ backgroundColor: titleColor }"
      ></span>
      <h2
        class="text-2xl font-semibold truncate text-light-title dark:text-dark-title text-ellipsis overflow-hidden ..."
      >
        {{ title }}
      </h2>
    </div>

    <!-- Affichage de la liste des utilisateurs si le slot "user-list" est utilisé -->
    <div v-if="$slots['user-list']">
      <slot name="user-list"></slot>
    </div>

    <!-- Afficher la description si fournie -->
    <div
      v-if="description"
      class="text-base text-light-form-text dark:text-dark-form-text mb-2 text-ellipsis overflow-hidden ..."
    >
      {{ description }}
    </div>

    <!-- Afficher les champs supplémentaires si les props sont fournies -->
    <div class="space-y-2">
      <div v-if="location" class="flex items-center">
        <font-awesome-icon
          icon="map-marker-alt"
          class="mr-2 text-light-form-text dark:text-dark-form-text"
        />
        <span class="text-light-form-text dark:text-dark-form-text">
          {{ location }}
        </span>
      </div>
      <div v-if="date" class="flex items-center">
        <font-awesome-icon
          icon="calendar-alt"
          class="mr-2 text-light-form-text dark:text-dark-form-text"
        />
        <span class="text-light-form-text dark:text-dark-form-text">
          {{ formattedDate }}
        </span>
      </div>
      <div v-if="status" class="flex items-center">
        <span
          :class="getStatusClass(status)"
          class="px-2 py-1 rounded-full text-sm font-semibold"
        >
          {{ getStatusLabel(status) }}
        </span>
      </div>
      <!-- Slot pour contenu supplémentaire -->
      <slot name="additional-content"></slot>
    </div>

    <div v-if="hasActions" class="flex justify-between mt-4 w-full">
      <ButtonComponent
        v-if="showDeleteButton || hasActions"
        variant="danger"
        fontAwesomeIcon="trash"
        @click.stop="onDelete"
      />
      <ButtonComponent
        v-if="showEditButton || hasActions"
        variant="warning"
        fontAwesomeIcon="pen"
        @click.stop="onEdit"
      />
    </div>
  </div>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    components: {
      ButtonComponent,
    },
    props: {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        default: '',
      },
      image: {
        type: String,
        default: '',
      },
      titleColor: {
        type: String,
        default: '',
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
        default: false,
      },
      location: {
        type: String,
        default: '',
      },
      date: {
        type: [String, Date],
        default: '',
      },
      status: {
        type: String,
        default: '',
      },
      cornerCount: String,
    },
    computed: {
      formattedDate() {
        if (this.date) {
          return new Date(this.date).toLocaleDateString();
        }
        return '';
      },
    },
    methods: {
      onDelete() {
        this.$emit('delete');
      },
      onEdit() {
        this.$emit('edit');
      },
      getStatusClass(status) {
        switch (status) {
          case 'draft':
            return 'bg-light-form-border-default dark:bg-dark-form-border-default text-light-form-text dark:text-dark-form-text';
          case 'ready':
            return 'bg-blue-200 dark:bg-blue-600 text-blue-800 dark:text-blue-200';
          case 'active':
            return 'bg-light-buttonVariants-primary-default dark:bg-dark-buttonVariants-primary-default text-white';
          case 'completed':
            return 'bg-yellow-200 dark:bg-yellow-600 text-yellow-800 dark:text-yellow-200';
          default:
            return 'bg-light-form-border-default dark:bg-dark-form-border-default text-light-form-text dark:text-dark-form-text';
        }
      },
      getStatusLabel(status) {
        switch (status) {
          case 'draft':
            return 'Brouillon';
          case 'ready':
            return 'Prêt';
          case 'active':
            return 'En cours';
          case 'completed':
            return 'Terminé';
          default:
            return status;
        }
      },
    },
  };
</script>

<style scoped>
  /* Minimal CSS, almost all handled by Tailwind */
</style>
