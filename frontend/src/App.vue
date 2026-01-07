<script setup>
import Toast from 'primevue/toast'
</script>

<template>
  <Toast position="top-center" />
  <router-view />
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>
