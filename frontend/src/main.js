import { createApp } from 'vue';
import App from './App.vue';

import store from './store';    // Importe Vuex (ton store)
import router from './router'; // Importer le router
import vue3TouchEvents from "vue3-touch-events";
import 'vue3-toastify/dist/index.css'; // Importer les styles de vue3-toastify
import Vue3Toastify from 'vue3-toastify';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import {
    faQuestionCircle,
    faMapMarkerAlt,
    faCalendarAlt,
    faSun,
    faMoon,
    faUser,
    faPowerOff,
    faSignInAlt
} from '@fortawesome/free-solid-svg-icons'
import './assets/tailwind.css'; // Import Tailwind CSS
import 'leaflet/dist/leaflet.css';

// Ajouter les icônes supplémentaires
library.add(faQuestionCircle, faMapMarkerAlt, faCalendarAlt, faSun, faMoon, faUser, faPowerOff, faSignInAlt)

const app = createApp(App);

// Initialise l'état d'authentification dès le chargement de l'application
store.dispatch('initializeAuth');
app.use(vue3TouchEvents);
app.use(store);
app.use(router);
app.use(Vue3Toastify, {
    autoClose: 1000,
});

// Enregistrer le composant FontAwesomeIcon globalement
app.component('font-awesome-icon', FontAwesomeIcon)

app.mount('#app');
console.log(process.env.VUE_APP_API_URL);
