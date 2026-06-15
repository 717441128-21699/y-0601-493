<script setup lang="ts">
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    width?: string
    footer?: boolean
  }>(),
  {
    title: '',
    width: '720px',
    footer: true,
  }
)

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
  (e: 'confirm'): void
}>()

const close = () => {
  emit('update:visible', false)
  emit('close')
}

const confirm = () => {
  emit('confirm')
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-[1000] flex items-center justify-center p-4"
      >
        <div
          class="absolute inset-0 backdrop-blur-sm bg-black/50"
          @click="close"
        />
        <Transition name="modal-scale">
          <div
            v-if="visible"
            class="relative rounded-xl overflow-hidden flex flex-col shadow-glow-blue"
            :style="{ width, maxHeight: '90vh', background: 'linear-gradient(180deg, rgba(21,42,71,0.95) 0%, rgba(15,31,56,0.98) 100%)', border: '1px solid rgba(24,144,255,0.35)' }"
          >
            <div class="flex items-center justify-between px-6 py-4 border-b border-default shrink-0">
              <div class="flex items-center gap-3">
                <span class="w-1 h-5 rounded-full bg-primary-500" />
                <h3 class="text-base font-semibold text-text-primary">{{ title }}</h3>
              </div>
              <button
                class="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-primary-500/10 hover:text-primary-300 transition-all duration-200"
                @click="close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            <div class="flex-1 overflow-y-auto px-6 py-4">
              <slot />
            </div>

            <div
              v-if="footer || $slots.footer"
              class="px-6 py-4 border-t border-default shrink-0 flex items-center justify-end gap-3"
            >
              <slot name="footer">
                <button
                  class="btn-ghost px-5 py-2 text-sm"
                  @click="close"
                >
                  取消
                </button>
                <button
                  class="btn-primary px-5 py-2 text-sm"
                  @click="confirm"
                >
                  确定
                </button>
              </slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-scale-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-scale-leave-active {
  transition: all 0.2s ease;
}
.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(8px);
}
</style>
