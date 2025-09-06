<template>
  <div class="mb-4">
    <button class="btn btn-secondary" @click="handleRetour">
      ← Retour
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  to: {
    type: String,
    default: '/admin'
  },
  onClick: {
    type: Function,
    default: null
  }
});

const handleRetour = () => {
  if (props.onClick) {
    props.onClick();
  } else {
    router.push(props.to);
  }
};
</script>

