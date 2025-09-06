import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { db, auth } from './firebase.js';

const app = createApp(App);

app.use(router);

app.provide('db', db);
app.provide('auth', auth);

app.mount('#app');
