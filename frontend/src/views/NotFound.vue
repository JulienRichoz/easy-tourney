<template>
    <div class="not-found">
      <h1>Page non trouvée</h1>
      <p>La page que vous cherchez n'existe pas.</p>
      <router-link to="/">Retour à l'accueil</router-link>
    </div>
</template>
  
<script>
  export default {
    name: 'NotFound'
  };
</script>
  
<style scoped>    
  .not-found {
    text-align: center;
    margin-top: 50px;
  }
</style>
  