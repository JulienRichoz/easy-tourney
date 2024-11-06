<template>
  <div
    class="flex justify-center items-center h-full bg-light-background dark:bg-dark-background p-8"
  >
    <div
      class="bg-light-card dark:bg-dark-card p-10 rounded-lg shadow-md w-full max-w-sm"
    >
      <h1
        class="text-2xl font-bold text-center mb-8 text-light-title dark:text-dark-title"
      >
        {{ mode === 'login' ? 'Connexion' : 'Inscription' }}
      </h1>
      <form @submit.prevent="handleSubmit">
        <!-- Champ Nom (uniquement pour l'inscription) -->
        <div v-if="mode === 'register'" class="mb-6">
          <label
            for="name"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Nom
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Entrer votre nom"
            class="w-full p-3 border rounded-md bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
            :class="{
              'border-light-form-error dark:border-dark-form-error':
                errors.name,
              'border-light-form-border-default dark:border-dark-form-border-default':
                !errors.name,
            }"
          />
          <p
            v-if="errors.name"
            class="text-light-form-error dark:text-dark-form-error text-sm mt-1"
          >
            {{ errors.name }}
          </p>
        </div>

        <!-- Champ Email -->
        <div class="mb-6">
          <label
            for="email"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Email
          </label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="Entrer votre email"
            class="w-full p-3 border rounded-md bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
            :class="{
              'border-light-form-error dark:border-dark-form-error':
                errors.email,
              'border-light-form-border-default dark:border-dark-form-border-default':
                !errors.email,
            }"
          />
          <p
            v-if="errors.email"
            class="text-light-form-error dark:text-dark-form-error text-sm mt-1"
          >
            {{ errors.email }}
          </p>
        </div>

        <!-- Champ Mot de Passe -->
        <div class="mb-6">
          <label
            for="password"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Mot de passe
          </label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="Entrer votre mot de passe"
            class="w-full p-3 border rounded-md bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
            :class="{
              'border-light-form-error dark:border-dark-form-error':
                errors.password,
              'border-light-form-border-default dark:border-dark-form-border-default':
                !errors.password,
            }"
          />
          <p
            v-if="errors.password"
            class="text-light-form-error dark:text-dark-form-error text-sm mt-1"
          >
            {{ errors.password }}
          </p>
        </div>

        <!-- Bouton de soumission -->
        <ButtonComponent
          variant="primary"
          nativeType="submit"
          class="w-full"
          :disabled="isSubmitting"
        >
          {{ mode === 'login' ? 'Se connecter' : "S'inscrire" }}
        </ButtonComponent>
      </form>

      <!-- Message d'erreur général -->
      <p
        v-if="error"
        class="text-light-form-error dark:text-dark-form-error mt-4 text-center font-semibold"
      >
        {{ error }}
      </p>

      <!-- Lien vers l'inscription ou la connexion -->
      <p
        v-if="mode === 'login'"
        class="text-center mt-6 text-light-form-text dark:text-dark-form-text"
      >
        Pas de compte ?
        <router-link
          to="/register"
          class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
          >Créer un compte</router-link
        >
      </p>
      <p
        v-else
        class="text-center mt-6 text-light-form-text dark:text-dark-form-text"
      >
        Déjà un compte ?
        <router-link
          to="/login"
          class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
          >Se connecter</router-link
        >
      </p>
    </div>
  </div>
</template>

<script>
  import ButtonComponent from '@/components/ButtonComponent.vue';

  export default {
    name: 'AuthComponentForm',
    components: {
      ButtonComponent,
    },
    props: {
      mode: {
        type: String,
        default: 'login', // 'login' ou 'register'
      },
      error: {
        type: String,
        default: '',
      },
      isSubmitting: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['submit'],
    data() {
      return {
        formData: {
          name: '',
          email: '',
          password: '',
        },
        errors: {},
      };
    },
    methods: {
      handleSubmit() {
        this.errors = {};

        // Validation basique
        if (this.mode === 'register' && !this.formData.name) {
          this.errors.name = 'Le nom est obligatoire.';
        }
        if (!this.formData.email) {
          this.errors.email = "L'email est obligatoire.";
        } else if (!this.validateEmail(this.formData.email)) {
          this.errors.email = 'Veuillez entrer un email valide.';
        }
        if (!this.formData.password) {
          this.errors.password = 'Le mot de passe est obligatoire.';
        }

        if (Object.keys(this.errors).length === 0) {
          // Pas d'erreurs, émettre l'événement 'submit' avec les données du formulaire
          this.$emit('submit', { ...this.formData });
        }
      },
      validateEmail(email) {
        // Simple regex pour valider l'email
        const re = /\S+@\S+\.\S+/;
        return re.test(email);
      },
    },
    watch: {
      mode() {
        // Réinitialiser les données du formulaire lorsque le mode change
        this.formData = {
          name: '',
          email: '',
          password: '',
        };
        this.errors = {};
      },
    },
  };
</script>

<style scoped>
  /* Les styles sont gérés via Tailwind CSS */
</style>
