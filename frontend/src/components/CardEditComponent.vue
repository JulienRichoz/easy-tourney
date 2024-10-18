<template>
  <div
    class="cursor-pointer bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-transform transform hover:scale-105 flex flex-col justify-between h-auto min-h-[200px] dark:bg-custom_dark_2"
    @click="$emit('click')"
  >
    <img
      v-if="image"
      :src="image"
      class="w-full h-28 object-cover mb-4 rounded-lg"
    />
    <h2
      class="text-2xl font-semibold mb-4 truncate"
      :style="{ color: titleColor }"
    >
      {{ title }}
    </h2>

    <!-- Afficher les champs supplémentaires si les props sont fournies -->
    <div class="space-y-2">
      <div v-if="location" class="flex items-center">
        <font-awesome-icon icon="map-marker-alt" class="mr-2 text-gray-500" />
        <span>{{ location }}</span>
      </div>
      <div v-if="date" class="flex items-center">
        <font-awesome-icon icon="calendar-alt" class="mr-2 text-gray-500" />
        <span>{{ formattedDate }}</span>
      </div>
      <div v-if="status" class="flex items-center">
        <span
          :class="getStatusClass(status)"
          class="px-2 py-1 rounded-full text-sm font-semibold"
        >
          {{ getStatusLabel(status) }}
        </span>
      </div>
      <!-- Autres champs supplémentaires peuvent être ajoutés ici -->
    </div>

    <div v-if="hasActions" class="flex justify-between mt-4 w-full">
      <ButtonComponent
        v-if="showDeleteButton || hasActions"
        variant="danger"
        icon="TrashIcon"
        @click.stop="onDelete"
      />
      <ButtonComponent
        v-if="showEditButton || hasActions"
        variant="warning"
        icon="PencilIcon"
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
      title: String,
      subtitle: String,
      image: String,
      titleColor: String,
      showDeleteButton: Boolean,
      showEditButton: Boolean,
      hasActions: Boolean,
      location: String,
      date: [String, Date],
      status: String,
    },
    computed: {
      formattedDate() {
        if (this.date) {
          return new Date(this.date).toLocaleDateString();
          // Ou utiliser date-fns pour un formatage plus précis
          // return format(new Date(this.date), 'dd/MM/yyyy');
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
            return 'bg-gray-200 text-gray-800';
          case 'ready':
            return 'bg-blue-200 text-blue-800';
          case 'active':
            return 'bg-green-200 text-green-800';
          case 'completed':
            return 'bg-yellow-200 text-yellow-800';
          default:
            return 'bg-gray-200 text-gray-800';
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
