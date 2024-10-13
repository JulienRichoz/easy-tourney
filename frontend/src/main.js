import { createApp } from 'vue';
import App from './App.vue';
import store from './store';    // Importe Vuex (ton store)
import router from './router'; // Importer le router
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';
import './assets/tailwind.css'; // Import Tailwind CSS
import 'leaflet/dist/leaflet.css';


const app = createApp(App);

// Initialise l'état d'authentification dès le chargement de l'application
store.dispatch('initializeAuth');

app.use(store);
app.use(router);
app.mount('#app');
