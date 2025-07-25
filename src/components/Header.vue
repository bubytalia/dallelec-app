<!-- src/components/Header.vue -->
<template>
  <header class="text-center my-4">
    <img
      src="@/assets/logo.jpg"
      alt="Logo"
      class="img-fluid"
      style="max-height: 60px;" 
    />
  </header>
</template>

<script>
export default {
  name: 'Header'
};
</script>

<style scoped>
header {
  background-color: #ffffff;
  padding: 10px 0;
  border-bottom: 1px solid #ddd;
}
</style>
