<!-- StatusSelectorComponent.vue -->

<template>
  <div class="status-selector">
    <label :for="statusKey">{{ label }}</label>
    <select :id="statusKey" v-model="selectedStatus" @change="onStatusChange">
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
        default: 'Statut',
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
