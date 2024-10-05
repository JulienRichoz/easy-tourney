<template>
  <div id="app">
    <Menu />
    <router-view></router-view> <!-- Cela affichera les routes -->
  </div>
</template>

<script>
import Menu from './components/MenuComponent'; // Importe le composant Menu

export default {
  name: 'App',
  components: {
    Menu
  } // Importe le composant Menu
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
