<template>
  <FullCalendar :options="calendarOptions" />
</template>

<script>
  import FullCalendar from '@fullcalendar/vue3';
  import dayGridPlugin from '@fullcalendar/daygrid';
  import interactionPlugin from '@fullcalendar/interaction';
  import apiService from '@/services/apiService';

  export default {
    components: {
      FullCalendar,
    },
    props: {
      fields: {
        type: Array,
        required: true,
      },
    },
    data() {
      return {
        calendarOptions: {
          plugins: [dayGridPlugin, interactionPlugin],
          initialView: 'dayGridMonth', // Corrigez ici pour vous assurer qu'une vue valide est définie
          editable: true,
          events: [],
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          },
        },
      };
    },
    watch: {
      fields: {
        immediate: true,
        handler(newFields) {
          this.populateEvents(newFields);
        },
      },
    },
    methods: {
      populateEvents(fields) {
        if (!fields || !Array.isArray(fields)) {
          console.error('Les données des terrains ne sont pas disponibles.');
          return;
        }

        this.calendarOptions.events = fields.flatMap((field) =>
          field.sportFields.map((sportField) => ({
            id: sportField.id,
            title: sportField.sport.name,
            start: `2024-11-15T${sportField.startTime}`,
            end: `2024-11-15T${sportField.endTime}`,
            backgroundColor: sportField.sport.color || '#cccccc',
            extendedProps: {
              fieldId: field.id,
            },
          }))
        );
      },
      handleEventDrop({ event }) {
        console.log('Événement déplacé:', event);
        const updatedEvent = {
          id: event.id,
          startTime: event.startStr.split('T')[1],
          endTime: event.endStr.split('T')[1],
          fieldId: event.extendedProps.fieldId,
        };

        this.updateEventInDatabase(updatedEvent);
      },
      async updateEventInDatabase(event) {
        try {
          await apiService.put(`/sport-fields/${event.id}`, {
            startTime: event.startTime,
            endTime: event.endTime,
            fieldId: event.fieldId,
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
  /* Ajoutez des styles personnalisés si nécessaire */
</style>
