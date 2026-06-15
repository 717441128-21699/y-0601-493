<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Compass, Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()

function goHome() {
  router.push('/dashboard')
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/dashboard')
  }
}
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-bg-primary flex items-center justify-center">
    <div
      class="absolute inset-0 tech-grid"
      style="background-image:
        radial-gradient(ellipse at 70% 30%, rgba(24, 144, 255, 0.20) 0%, transparent 55%),
        radial-gradient(ellipse at 20% 75%, rgba(114, 46, 209, 0.15) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 50%, rgba(24, 144, 255, 0.05) 0%, transparent 70%);"
    ></div>

    <div class="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl animate-float"></div>
    <div class="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-[#722ED1]/10 blur-3xl animate-float" style="animation-delay: 1.5s;"></div>

    <div class="relative z-10 flex flex-col items-center justify-center px-6 text-center animate-fade-in-up" style="animation-delay: 0.1s;">
      <div class="relative mb-8">
        <div
          class="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse-slow"
          style="background: radial-gradient(circle, rgba(24,144,255,0.35) 0%, transparent 70%);"
        ></div>
        <Compass
          class="relative w-28 h-28 opacity-25 animate-[spin_20s_linear_infinite]"
          style="color: #1890FF;"
        />
      </div>

      <div class="relative mb-6">
        <h1
          class="font-rajdhani font-bold text-[180px] leading-none select-none"
          style="
            background: linear-gradient(135deg, #95CBFF 0%, #3399FF 25%, #1890FF 50%, #003A8C 75%, #002766 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 80px rgba(24,144,255,0.35);
            filter: drop-shadow(0 0 40px rgba(24,144,255,0.4));
          "
        >
          404
        </h1>
      </div>

      <h2 class="text-3xl font-bold mb-4 flex items-center gap-3" style="color: #E6F0FF;">
        <span class="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary-400 via-[#722ED1] to-primary-700"></span>
        页面未找到
      </h2>

      <p class="text-base max-w-md leading-relaxed mb-10" style="color: #8FA3BF;">
        您访问的页面不存在或已被移除，请检查 URL 或返回首页。
        <br />
        如您是通过链接访问此处，可能该链接已过期或失效。
      </p>

      <div class="flex items-center gap-4 flex-wrap justify-center">
        <button
          class="btn-ghost h-11 px-6 flex items-center gap-2 font-medium text-sm"
          @click="goBack"
        >
          <ArrowLeft class="w-4 h-4" />
          回到上一页
        </button>
        <button
          class="btn-primary h-11 px-6 flex items-center gap-2 font-medium text-sm shadow-glow-blue"
          @click="goHome"
        >
          <Home class="w-4 h-4" />
          返回首页
        </button>
      </div>

      <div class="mt-16 pt-6 border-t border-default/40 text-xs" style="color: #5C7799;">
        <div class="flex items-center justify-center gap-2">
          <Compass class="w-3 h-3" />
          <span>ErrorCode: 404_NOT_FOUND · RequestID: NF-{{ Math.random().toString(36).slice(2, 10).toUpperCase() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
