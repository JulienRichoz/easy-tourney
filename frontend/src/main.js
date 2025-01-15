// src/main.js
// Description: Ce fichier est le point d'entrée de l'application Vue.js.
// Il configure les plugins et les composants globaux utilisés dans l'application.
// Il initialise également le store Vuex, le router et d'autres configurations nécessaires.

import { createApp } from 'vue';
import App from './App.vue';

import store from './store'; // Importe Vuex store
import router from './router'; // Importer le router
import vue3TouchEvents from 'vue3-touch-events';
import Vue3Toastify from 'vue3-toastify';
import 'vue3-toastify/dist/index.css'; // Importer les styles de vue3-toastify
import vSelect from 'vue-select';
import 'vue-select/dist/vue-select.css';
import './assets/vue-select-custom.css'; // Import des styles personnalisés pour vue-select
import '@fortawesome/fontawesome-free/css/all.css';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { registerIcons } from './components/icons/fontAwesomeIcons'; // Liste des icônes à enregistrer
import './assets/tailwind.css'; // Import Tailwind CSS
import 'leaflet/dist/leaflet.css';
//import './registerServiceWorker';

// Ajouter les icônes supplémentaires
registerIcons(); // Enregistrer les icônes dans FontAwesome

const app = createApp(App);

// Enregistrer le composant FontAwesomeIcon globalement
app.component('font-awesome-icon', FontAwesomeIcon);
app.component('v-select', vSelect);
// Initialise l'état d'authentification dès le chargement de l'application
store.dispatch('initializeAuth');
app.use(vue3TouchEvents);
app.use(store);
app.use(router);
app.use(Vue3Toastify, {
  autoClose: 2000,
});

app.mount('#app');
