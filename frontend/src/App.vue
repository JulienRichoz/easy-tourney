<template>
  <div id="app" class="min-h-screen bg-gray-100">
    <Menu />
    <div class="p-4">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  import Menu from './components/MenuComponent'; // Importe le composant Menu

  export default {
    name: 'App',
    components: {
      Menu,
    },
  };
</script>

<style>
  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color: #2c3e50;
  }
</style>
