<!-- src/components/FilterComponent.vue -->
<!-- Composant pour afficher des filtres sous forme de selects. -->
<!-- Il affiche une liste de filtres avec des options. -->
<!-- Lorsqu'on change un filtre, il émet un événement vers le parent. -->
<!-- !!! Attention au changement => Utilisé dans de nombreuses pages. !!! -->

<template>
  <div class="flex flex-wrap items-center gap-4">
    <div
      v-for="filter in filters"
      :key="filter.label"
      class="flex items-center"
    >
      <!-- Icônes pour les filtres sur mobile -->
      <font-awesome-icon
        v-if="filter.label === 'Filtrer par statut'"
        :icon="['fas', 'filter']"
        class="block sm:hidden mr-2"
      />
      <font-awesome-icon
        v-if="filter.label === 'Filtrer par date'"
        :icon="['fas', 'calendar']"
        class="block sm:hidden mr-2"
      />

      <!-- Label pour les filtres sur écran plus grand -->
      <span
        class="hidden sm:inline text-light-form-text dark:text-dark-form-text font-semibold mr-2"
      >
        {{ filter.label }}:
      </span>

      <div class="relative inline-block">
        <select
          v-model="filter.value"
          @change="onFilterChange(filter)"
          class="bg-light-form-background dark:bg-dark-form-background p-2 pr-8 border border-light-form-border-default dark:border-dark-form-border-default rounded-md shadow-sm hover:bg-light-subMenu-hoverBackground dark:hover:bg-dark-subMenu-hoverBackground appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-light-form-text dark:text-dark-form-text"
        >
          <option
            v-for="option in filter.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>

        <!-- Petite icône flèche -->
        <div
          class="absolute inset-y-0 right-0 flex items-center pointer-events-none"
        >
          <svg
            class="w-4 h-4 text-light-form-iconQuestion dark:text-dark-form-iconQuestion mr-2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      filters: {
        type: Array,
        required: true,
        // Exemple d'un élément de l'array:
        // {
        //   label: 'Filtrer par statut',
        //   value: '', // la valeur actuelle du filtre (dynamique)
        //   options: [
        //     { label: 'Tous les statuts', value: '' },
        //     { label: 'Brouillon', value: 'draft' },
        //     { label: 'Prêt', value: 'ready' },
        //     { label: 'En cours', value: 'active' },
        //     { label: 'Terminé', value: 'completed' },
        //   ],
        //   placeholder: 'Choisir un statut'
        // }
      },
    },
    methods: {
      onFilterChange(filter) {
        // Émettre un événement vers le parent avec le filtre mis à jour
        this.$emit('filter-change', filter);
      },
    },
  };
</script>

<style scoped>
  select {
    transition: all 0.2s ease-in-out;
  }
  select:hover {
    transform: scale(1.02);
  }
</style>
