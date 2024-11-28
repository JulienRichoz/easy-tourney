<template>
  <div>
    <input
      :value="value"
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
      value: {
        type: Object, // Maintenant, la valeur est un objet contenant address, latitude, longitude
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
        suggestions: [],
        query: '',
        timeout: null,
      };
    },
    methods: {
      onInput(event) {
        const value = event.target.value;
        this.$emit('input', value);
        this.query = value;

        if (this.timeout) clearTimeout(this.timeout);

        if (value.length > 2) {
          this.timeout = setTimeout(() => {
            this.fetchSuggestions();
          }, 300);
        } else {
          this.suggestions = [];
        }
      },
      onAddressSelected(selected) {
        // Exemple: selected contient address, latitude, longitude
        this.$emit('input', {
          address: selected.address,
          latitude: selected.latitude,
          longitude: selected.longitude,
        });
      },
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
      selectSuggestion(suggestion) {
        this.$emit('input', suggestion.display_name);
        this.suggestions = [];
      },
    },
  };
</script>

<style scoped>
  /* Styles personnalisés si nécessaire */
</style>
