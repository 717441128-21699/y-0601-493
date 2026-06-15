<template>
  <div class="tech-grid min-h-screen w-full">
    <router-view />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.tech-grid {
  position: relative;
  background-color: #050b1a;
  background-image:
    linear-gradient(rgba(56, 189, 248, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56, 189, 248, 0.06) 1px, transparent 1px);
  background-size: 40px 40px;
}
.tech-grid::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(1200px 600px at 15% -10%, rgba(56, 189, 248, 0.12), transparent 60%),
    radial-gradient(900px 500px at 85% 10%, rgba(168, 85, 247, 0.10), transparent 60%),
    radial-gradient(800px 600px at 50% 100%, rgba(34, 197, 94, 0.06), transparent 60%);
}
</style>
