import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { db, auth } from './firebase'; // ← importa da file separato

const app = createApp(App);

app.use(router);

app.provide('auth', auth);
app.provide('db', db);

app.mount('#app');
