<template>
  <div id="app">
    <Header v-if="!isLoginPage" />
    <router-view />
  </div>
</template>

<script>
import Header from '@/components/Header.vue';

export default {
  name: 'App',
  components: {
    Header
  },
  computed: {
    isLoginPage() {
      return this.$route.name === 'Login';
    }
  }
};
</script>

<style>
body {
  background-color: #f8f9fa;
}
</style>
