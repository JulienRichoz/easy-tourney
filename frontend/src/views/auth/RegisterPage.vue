<template>
  <div class="flex items-center justify-center pt-16 bg-gray-100">
    <div class="bg-white p-10 rounded-lg shadow-md w-full max-w-sm">
      <h1 class="text-2xl font-bold text-center mb-8">Inscription</h1>
      <form @submit.prevent="handleRegister">
        <!-- Champ Nom -->
        <FormInputComponent
          id="name"
          label="Nom"
          v-model="name"
          placeholder="Entrer votre nom"
          :required="true"
          class="mb-6"
          :touched="nameTouched"
          @blur="nameTouched = true"
        />

        <!-- Champ Email -->
        <FormInputComponent
          id="email"
          label="Email"
          type="email"
          v-model="email"
          placeholder="Entrer votre email"
          :required="true"
          :validate="true"
          class="mb-6"
          :touched="emailTouched"
          @blur="emailTouched = true"
        />

        <!-- Champ Mot de Passe -->
        <FormInputComponent
          id="password"
          label="Mot de passe"
          type="password"
          v-model="password"
          placeholder="Entrer votre mot de passe"
          :required="true"
          class="mb-6"
          :touched="passwordTouched"
          @blur="passwordTouched = true"
        />

        <div class="form-group">
          <label for="role">Rôle</label>
          <select
            v-model="roleId"
            id="role"
            required
            class="w-full p-3 mb-6 border border-gray-300 rounded-md"
          >
            <option value="1">Admin</option>
            <option value="2">Assistant</option>
            <option value="3">Player</option>
            <option value="4">Guest</option>
          </select>
        </div>

        <ButtonComponent variant="primary" type="submit" class="w-full">
          S'inscrire
        </ButtonComponent>
      </form>

      <p v-if="error" class="text-red-500 mt-4 text-center font-semibold">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script>
  import apiService from '../../services/apiService';
  import FormInputComponent from '../../components/FormInputComponent.vue';
  import ButtonComponent from '../../components/ButtonComponent.vue';

  export default {
    name: 'RegisterPage',
    components: {
      FormInputComponent,
      ButtonComponent,
    },
    data() {
      return {
        name: '',
        email: '',
        password: '',
        roleId: 3, // Valeur par défaut pour 'Player'
        error: '',
        nameTouched: false,
        emailTouched: false,
        passwordTouched: false,
      };
    },
    methods: {
      async handleRegister() {
        if (!this.name || !this.email || !this.password) {
          this.error = 'Tous les champs sont obligatoires.';
          return;
        }
        try {
          await apiService.post('/auth/register', {
            name: this.name,
            email: this.email,
            password: this.password,
            roleId: this.roleId,
          });

          this.$router.push('/user');
        } catch (err) {
          console.error("Erreur lors de l'inscription:", err);
          if (err.response && err.response.data && err.response.data.message) {
            this.error = err.response.data.message; // Utilise le message d'erreur renvoyé par le serveur
          } else {
            this.error =
              "Erreur lors de l'inscription. Veuillez vérifier vos informations.";
          }
        }
      },
    },
  };
</script>
