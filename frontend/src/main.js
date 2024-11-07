import { createApp } from 'vue';
import App from './App.vue';

import store from './store';    // Importe Vuex (ton store)
import router from './router'; // Importer le router
import vue3TouchEvents from "vue3-touch-events";
import Vue3Toastify from 'vue3-toastify';
import 'vue3-toastify/dist/index.css'; // Importer les styles de vue3-toastify
import vSelect from "vue-select";
import "vue-select/dist/vue-select.css";
import './assets/vue-select-custom.css'; // Import des styles personnalisés pour vue-select

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
    faQuestionCircle,
    faMapMarkerAlt,
    faCalendarAlt,
    faCalendar,
    faSun,
    faMoon,
    faUser,
    faPowerOff,
    faSignInAlt,
    faInfoCircle,
    faMap,
    faFutbol,
    faFilter,
    faCog,
    faPeopleGroup,
    faTrash,
    faPen,
    faPenAlt,
    faUsers,
    faEye,
    faPlus,
    faArrowLeft,
    faBan,
    faEnvelope,
    faTimes,
    faCheck,
    faLink,
    faCopy,
} from '@fortawesome/free-solid-svg-icons'
import './assets/tailwind.css'; // Import Tailwind CSS
import 'leaflet/dist/leaflet.css';
import './registerServiceWorker'

// Ajouter les icônes supplémentaires
library.add(faCopy, faLink, faCheck, faPenAlt, faTimes, faEnvelope, faBan, faArrowLeft, faPlus, faEye, faUsers, faPen, faTrash, faPeopleGroup, faCog, faQuestionCircle, faMapMarkerAlt, faCalendar, faCalendarAlt, faSun, faMoon, faUser, faPowerOff, faSignInAlt, faInfoCircle, faMap, faFutbol, faFilter)

const app = createApp(App);


// Enregistrer le composant FontAwesomeIcon globalement
app.component('font-awesome-icon', FontAwesomeIcon)
app.component('v-select', vSelect);
// Initialise l'état d'authentification dès le chargement de l'application
store.dispatch('initializeAuth');
app.use(vue3TouchEvents);
app.use(store);
app.use(router);
app.use(Vue3Toastify, {
    autoClose: 1000,
});

app.mount('#app');