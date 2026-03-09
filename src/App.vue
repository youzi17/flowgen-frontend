<template>
  <AppLayout />
</template>

<script setup lang="ts">
import AppLayout from './ui/layout/AppLayout.vue';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Avenir Next', 'Segoe UI Variable', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #34495e;
  background: linear-gradient(145deg, #eef2f5, #f6f4f1 45%, #edf2f7);
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
