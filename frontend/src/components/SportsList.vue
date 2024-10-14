<template>
  <div
    class="sports-list-container w-full md:w-64 p-4 border border-gray-300 rounded-lg bg-gray-100"
  >
    <h3>Liste des Sports</h3>
    <input
      type="text"
      v-model="searchTerm"
      placeholder="Rechercher un sport..."
      class="search-bar w-full p-2 md:p-3 border border-gray-300 rounded-md"
    />

    <vuedraggable
      :list="filteredSports"
      group="sports"
      @start="onDragStart"
      @end="onDragEnd"
    >
      <div
        v-for="sport in filteredSports"
        :key="sport.id"
        class="sport-item p-2 md:p-4 mb-2 rounded-md text-white font-semibold text-center cursor-pointer hover:scale-105 transform transition duration-300"
        :style="{ backgroundColor: sport.color }"
      >
        <span>{{ sport.name }}</span>
      </div>
    </vuedraggable>

    <button
      @click="resetSportsList"
      class="reset-button w-full p-2 md:p-3 bg-red-500 text-white rounded-md mt-2 hover:bg-red-600 transition duration-200"
    >
      Réinitialiser
    </button>
  </div>
</template>

<script>
  import vuedraggable from 'vuedraggable';

  export default {
    components: {
      vuedraggable,
    },
    props: {
      sports: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        searchTerm: '',
      };
    },
    computed: {
      filteredSports() {
        return this.sports.filter((sport) =>
          sport.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      },
    },
    methods: {
      resetSportsList() {
        this.searchTerm = '';
      },
      onDragStart(event) {
        console.log('Début du drag:', event);
      },
      onDragEnd(event) {
        console.log('Fin du drag:', event);
      },
    },
  };
</script>

<style scoped>
  .search-bar {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .sport-item {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    cursor: grab;
    background-color: #e0e0e0;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .reset-button {
    width: 100%;
    padding: 0.5rem;
    margin-top: 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
