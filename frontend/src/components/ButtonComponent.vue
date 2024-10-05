<template>
    <button
      :class="['btn', `btn-${variant}`, { 'btn-disabled': disabled }]"
      :disabled="disabled"
      @click="handleClick"
    >
      <slot></slot>
    </button>
  </template>
  
  <script>
  export default {
    name: 'ButtonComponent',
    props: {
      variant: {
        type: String,
        default: 'primary',
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      onClick: {
        type: Function,
        default: null,
      },
    },
    methods: {
      handleClick() {
        if (!this.disabled && this.onClick) {
          this.onClick();
        }
      },
    },
  };
  </script>
  
  <style scoped>
  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
  }
  
  .btn-primary {
    background-color: #42b983;
    color: white;
  }
  
  .btn-secondary {
    background-color: #ccc;
    color: #333;
  }
  
  .btn-disabled {
    background-color: #e0e0e0;
    color: #999;
    cursor: not-allowed;
  }
  </style>