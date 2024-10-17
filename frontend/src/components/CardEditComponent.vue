<template>
  <div
    class="cursor-pointer bg-white p-4 rounded-lg shadow-md hover:bg-gray-50 transition-transform transform hover:scale-105 flex flex-col justify-between h-auto min-h-[200px]"
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
    <p v-if="subtitle" class="text-gray-500">{{ subtitle }}</p>
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
    },
    methods: {
      onDelete() {
        this.$emit('delete');
      },
      onEdit() {
        this.$emit('edit');
      },
    },
  };
</script>
