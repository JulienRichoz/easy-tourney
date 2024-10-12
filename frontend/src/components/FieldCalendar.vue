<template>
  <div>
    <FullCalendar
      :options="calendarOptions"
      @eventDrop="handleEventDrop"
      @eventResize="handleEventResize"
    />
  </div>
</template>

<script>
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';

  export default {
    props: {
      field: {
        type: Object,
        required: true,
      },
    },
    components: {
      FullCalendar,
    },
    data() {
      return {
        calendarOptions: {
          plugins: [dayGridPlugin, interactionPlugin],
          initialView: 'dayGridDay', // Vue quotidienne pour chaque terrain
          editable: true,
          events: this.populateEvents(this.field),
        },
      };
    },
    methods: {
      populateEvents(field) {
        // Ajouter les sports associés au terrain en tant qu'événements du calendrier
        if (!field || !field.sportFields) return [];

        return field.sportFields.map((sportField) => ({
          id: sportField.id,
          title: sportField.sport.name,
          start: `2024-11-15T${sportField.startTime}`,
          end: `2024-11-15T${sportField.endTime}`,
          backgroundColor: sportField.sport.color || '#cccccc',
        }));
      },
      handleEventDrop({ event }) {
        // Mise à jour de l'événement côté backend
        console.log('Événement déplacé:', event);
        const updatedEvent = {
          id: event.id,
          startTime: event.startStr.split('T')[1],
          endTime: event.endStr.split('T')[1],
        };
        this.updateEventInDatabase(updatedEvent);
      },
      handleEventResize({ event }) {
        // Mise à jour de l'événement redimensionné
        console.log('Événement redimensionné:', event);
        const updatedEvent = {
          id: event.id,
          startTime: event.startStr.split('T')[1],
          endTime: event.endStr.split('T')[1],
        };
        this.updateEventInDatabase(updatedEvent);
      },
      async updateEventInDatabase(event) {
        try {
          await apiService.put(`/sport-fields/${event.id}`, {
            startTime: event.startTime,
            endTime: event.endTime,
          });
          alert('Les horaires ont été mis à jour avec succès.');
        } catch (error) {
          console.error('Erreur lors de la mise à jour des horaires:', error);
          alert('Une erreur est survenue.');
        }
      },
    },
  };
</script>

<style scoped>
  /* Ajoute des styles si nécessaire */
</style>
