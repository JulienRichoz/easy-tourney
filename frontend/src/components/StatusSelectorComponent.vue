<!-- StatusSelectorComponent.vue -->
<template>
  <div v-if="shouldShow" class="flex items-center ml-4 sm:ml-8 w-1/2 sm:w-auto">
    <label
      :for="statusKey"
      class="hidden sm:block mr-2 text-light-title dark:text-dark-title"
    >
      {{ label }}
    </label>
    <select
      :id="statusKey"
      v-model="selectedStatus"
      @change="onStatusChange"
      class="bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text border border-light-form-border-default dark:border-dark-form-border-default rounded-md px-2 py-1"
    >
      <option
        v-for="option in statusOptions"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<script>
  export default {
    props: {
      tourneyId: {
        type: [Number, String],
        required: true,
      },
      statusKey: {
        type: String,
        required: true,
      },
      statusOptions: {
        type: Array,
        required: true,
      },
      label: {
        type: String,
        default: 'État :',
      },
      hideWhenNotStarted: {
        type: Boolean,
        default: true,
      },
    },
    data() {
      return {
        selectedStatus: '',
      };
    },
    computed: {
      currentStatus() {
        return this.$store.state.tourney.statuses[this.statusKey];
      },
      shouldShow() {
        // Ne pas afficher le sélecteur si le statut est 'notStarted' et que hideWhenNotStarted est vrai
        if (this.hideWhenNotStarted) {
          return this.currentStatus !== 'notStarted';
        }
        return true;
      },
    },
    watch: {
      currentStatus(newStatus) {
        this.selectedStatus = newStatus;
      },
    },
    methods: {
      onStatusChange() {
        this.$store.dispatch('tourney/updateStatus', {
          tourneyId: this.tourneyId,
          key: this.statusKey,
          value: this.selectedStatus,
        });
      },
    },
    mounted() {
      this.selectedStatus = this.currentStatus;
    },
  };
</script>
