<!-- AutocompleteAddress.vue -->
<!-- https://nominatim.openstreetmap.org/ui/search.html -->
<!-- Pour les suggestions d'adresses -->

<template>
  <!-- div pour l'input et la liste des suggestions -->
  <div>
    <input
      v-model="inputValue"
      @input="onInput"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-full p-2 rounded-md border bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text border-light-form-border-default dark:border-dark-form-border-default"
    />
    <ul
      v-if="suggestions.length > 0"
      class="border border-light-form-border-default dark:border-dark-form-border-default bg-light-card dark:bg-dark-card rounded-md mt-2 max-h-40 overflow-auto"
    >
      <li
        v-for="(suggestion, index) in suggestions"
        :key="index"
        @click="selectSuggestion(suggestion)"
        class="p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        {{ suggestion.display_name }}
      </li>
    </ul>
  </div>
</template>

<script>
  export default {
    name: 'AutocompleteAddress',
    props: {
      // Modèle de l'adresse complète avec les coordonnées
      modelValue: {
        type: Object, // { address: '', latitude: null, longitude: null }
        default: () => ({ address: '', latitude: null, longitude: null }),
      },
      placeholder: {
        type: String,
        default: 'Entrez une adresse',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        inputValue: this.modelValue.address || '',
        suggestions: [], // Liste des suggestions d'adresses
        query: '', // Recherche en cours
        timeout: null, // Timeout pour la recherche
      };
    },
    watch: {
      modelValue: {
        // Mettre à jour l'input si le modèle change
        handler(newVal) {
          if (newVal.address !== this.inputValue) {
            this.inputValue = newVal.address || '';
          }
        },
        deep: true,
      },
    },
    methods: {
      // Gestion de l'input onInput
      onInput(event) {
        const value = event.target.value;
        this.inputValue = value;
        this.query = value;

        if (this.timeout) clearTimeout(this.timeout);

        if (value.length > 2) {
          this.timeout = setTimeout(() => {
            this.fetchSuggestions();
          }, 300);
        } else {
          this.suggestions = [];
        }

        // Émettre un objet avec l'adresse et des coordonnées nulles
        this.$emit('update:modelValue', {
          address: value,
          latitude: null,
          longitude: null,
        });
      },

      // Récupérer les suggestions d'adresses
      async fetchSuggestions() {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              this.query
            )}&addressdetails=1&limit=5`,
            {
              headers: {
                'User-Agent': 'EasyTourney/1.0 (julienrichoz@outlook.com)',
              },
            }
          );
          const data = await response.json();
          this.suggestions = data;
        } catch (error) {
          console.error(
            'Erreur lors de la récupération des suggestions:',
            error
          );
        }
      },

      // Sélectionner une suggestion
      selectSuggestion(suggestion) {
        const selected = {
          address: suggestion.display_name,
          latitude: parseFloat(suggestion.lat),
          longitude: parseFloat(suggestion.lon),
        };
        this.inputValue = selected.address;
        this.$emit('update:modelValue', selected); // Émettre l'objet complet
        this.suggestions = [];
      },
    },
  };
</script>

<style scoped></style>
