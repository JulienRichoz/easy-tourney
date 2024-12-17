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
        {{ title }}
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
            name="name"
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
        <div v-if="showEmailField" class="mb-6">
          <label
            for="email"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            v-model="formData.email"
            type="email"
            placeholder="Entrer votre email"
            autocomplete="email"
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
        <div v-if="showPasswordFields" class="mb-6">
          <label
            for="password"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            v-model="formData.password"
            type="password"
            placeholder="Entrer votre mot de passe"
            autocomplete="new-password"
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

        <!-- Champ Confirmation Mot de Passe -->
        <div v-if="showConfirmPasswordField" class="mb-6">
          <label
            for="confirmPassword"
            class="block text-light-form-text dark:text-dark-form-text font-semibold mb-2"
          >
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            placeholder="Confirmer votre mot de passe"
            autocomplete="new-password"
            class="w-full p-3 border rounded-md bg-light-form-background dark:bg-dark-form-background text-light-form-text dark:text-dark-form-text"
            :class="{
              'border-light-form-error dark:border-dark-form-error':
                errors.confirmPassword,
              'border-light-form-border-default dark:border-dark-form-border-default':
                !errors.confirmPassword,
            }"
          />
          <p v-if="errors.confirmPassword" class="text-red-500 text-sm mt-1">
            {{ errors.confirmPassword }}
          </p>
        </div>

        <!-- Bouton de soumission -->
        <ButtonComponent
          variant="primary"
          nativeType="submit"
          class="w-full ml0 mr-0 sm:ml-0 sm:mr-0 px-2 sm:px-4 py-2"
          :disabled="isSubmitting"
        >
          {{ submitButtonText }}
        </ButtonComponent>
      </form>
      <p
        v-if="error"
        class="text-light-form-error dark:text-dark-form-error mt-4 text-center font-semibold"
      >
        {{ error }}
      </p>

      <!-- Liens contextuels -->
      <div
        class="text-center mt-6 text-light-form-text dark:text-dark-form-text"
      >
        <template v-if="mode === 'login'">
          Pas de compte ?
          <router-link
            to="/register"
            class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
            >Créer un compte</router-link
          >
          <br />
          <router-link
            to="/forgot-password"
            class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold block"
            >Mot de passe oublié ?</router-link
          >
        </template>

        <template v-else-if="mode === 'register'">
          Déjà un compte ?
          <router-link
            to="/login"
            class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
            >Se connecter</router-link
          >
        </template>

        <template v-else-if="mode === 'forgot-password'">
          <router-link
            to="/login"
            class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
            >Retour à la connexion</router-link
          >
        </template>

        <template v-else-if="mode === 'reset-password'">
          <router-link
            to="/login"
            class="text-light-menuHoverText dark:text-dark-menuHoverText font-semibold"
            >Retour à la connexion</router-link
          >
        </template>
      </div>
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
        default: 'login', // 'login', 'register', 'forgot-password', 'reset-password'
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
          confirmPassword: '',
        },
        errors: {},
      };
    },
    computed: {
      showEmailField() {
        return this.mode !== 'reset-password';
      },
      showPasswordFields() {
        return (
          this.mode === 'login' ||
          this.mode === 'register' ||
          this.mode === 'reset-password'
        );
      },
      showConfirmPasswordField() {
        return this.mode === 'register' || this.mode === 'reset-password';
      },
      title() {
        switch (this.mode) {
          case 'login':
            return 'Connexion';
          case 'register':
            return 'Inscription';
          case 'forgot-password':
            return 'Mot de passe oublié';
          case 'reset-password':
            return 'Réinitialiser le mot de passe';
          default:
            return 'Authentification';
        }
      },
      submitButtonText() {
        switch (this.mode) {
          case 'login':
            return 'Se connecter';
          case 'register':
            return "S'inscrire";
          case 'forgot-password':
            return 'Envoyer le lien';
          case 'reset-password':
            return 'Réinitialiser le mot de passe';
          default:
            return 'Soumettre';
        }
      },
    },
    methods: {
      handleSubmit() {
        this.errors = {};

        // Validation en fonction du mode
        if (this.mode === 'register') {
          this.validateRegister();
        } else if (this.mode === 'login') {
          this.validateLogin();
        } else if (this.mode === 'forgot-password') {
          this.validateForgotPassword();
        } else if (this.mode === 'reset-password') {
          this.validateResetPassword();
        }

        if (Object.keys(this.errors).length === 0) {
          // Émission des données appropriées en fonction du mode
          let payload = {};
          if (this.mode === 'login' || this.mode === 'register') {
            payload = { ...this.formData };
          } else if (this.mode === 'forgot-password') {
            payload = { email: this.formData.email };
          } else if (this.mode === 'reset-password') {
            payload = {
              password: this.formData.password,
              confirmPassword: this.formData.confirmPassword,
            };
          }

          this.$emit('submit', payload);
        }
      },
      validateRegister() {
        if (!this.formData.name) {
          this.errors.name = 'Le nom est obligatoire.';
        }

        if (!this.formData.email) {
          this.errors.email = "L'email est obligatoire.";
        } else if (!this.validateEmail(this.formData.email)) {
          this.errors.email = 'Veuillez entrer un email valide.';
        }

        if (!this.formData.password) {
          this.errors.password = 'Le mot de passe est obligatoire.';
        } else {
          const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
          if (!passwordRegex.test(this.formData.password)) {
            this.errors.password =
              'Le mot de passe doit contenir au moins 8 caractères et une majuscule.';
          }
        }

        if (!this.formData.confirmPassword) {
          this.errors.confirmPassword =
            'Veuillez confirmer votre mot de passe.';
        } else if (this.formData.password !== this.formData.confirmPassword) {
          this.errors.confirmPassword =
            'Les mots de passe ne correspondent pas.';
        }
      },
      validateLogin() {
        if (!this.formData.email) {
          this.errors.email = "L'email est obligatoire.";
        } else if (!this.validateEmail(this.formData.email)) {
          this.errors.email = 'Veuillez entrer un email valide.';
        }

        if (!this.formData.password) {
          this.errors.password = 'Le mot de passe est obligatoire.';
        }
      },
      validateForgotPassword() {
        if (!this.formData.email) {
          this.errors.email = "L'email est obligatoire.";
        } else if (!this.validateEmail(this.formData.email)) {
          this.errors.email = 'Veuillez entrer un email valide.';
        }
      },
      validateResetPassword() {
        if (!this.formData.password) {
          this.errors.password = 'Le mot de passe est obligatoire.';
        } else {
          const passwordRegex = /^(?=.*[A-Z]).{8,}$/;
          if (!passwordRegex.test(this.formData.password)) {
            this.errors.password =
              'Le mot de passe doit contenir au moins 8 caractères et une majuscule.';
          }
        }

        if (!this.formData.confirmPassword) {
          this.errors.confirmPassword =
            'Veuillez confirmer votre mot de passe.';
        } else if (this.formData.password !== this.formData.confirmPassword) {
          this.errors.confirmPassword =
            'Les mots de passe ne correspondent pas.';
        }
      },
      validateEmail(email) {
        // Regex simple pour valider l'email
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
          confirmPassword: '',
        };
        this.errors = {};
      },
    },
  };
</script>

<style scoped>
  /* Les styles sont gérés via Tailwind CSS */
</style>
