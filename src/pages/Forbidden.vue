<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ShieldAlert, Home, LogOut, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

function goHome() {
  router.push('/dashboard')
}

function logout() {
  userStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-bg-primary flex items-center justify-center">
    <div
      class="absolute inset-0 tech-grid"
      style="background-image:
        radial-gradient(ellipse at 30% 20%, rgba(24, 144, 255, 0.22) 0%, transparent 55%),
        radial-gradient(ellipse at 70% 80%, rgba(245, 34, 45, 0.12) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 50%, rgba(24, 144, 255, 0.06) 0%, transparent 70%);"
    ></div>

    <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary-500/10 blur-3xl animate-float"></div>
    <div class="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-danger-500/10 blur-3xl animate-float" style="animation-delay: 1s;"></div>

    <div class="relative z-10 flex flex-col items-center justify-center px-6 text-center animate-fade-in-up" style="animation-delay: 0.1s;">
      <div class="relative mb-8">
        <div
          class="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse-slow"
          style="background: radial-gradient(circle, rgba(24,144,255,0.4) 0%, transparent 70%);"
        ></div>
        <ShieldAlert
          class="relative w-28 h-28 opacity-25"
          style="color: #1890FF;"
        />
      </div>

      <div class="relative mb-6">
        <h1
          class="font-rajdhani font-bold text-[180px] leading-none select-none"
          style="
            background: linear-gradient(135deg, #63B3FF 0%, #1890FF 35%, #002766 70%, #0050B3 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            text-shadow: 0 0 80px rgba(24,144,255,0.35);
            filter: drop-shadow(0 0 40px rgba(24,144,255,0.4));
          "
        >
          403
        </h1>
      </div>

      <h2 class="text-3xl font-bold mb-4 flex items-center gap-3" style="color: #E6F0FF;">
        <span class="w-1.5 h-8 rounded-full bg-gradient-to-b from-primary-400 to-primary-700"></span>
        访问被拒绝
      </h2>

      <p class="text-base max-w-md leading-relaxed mb-10" style="color: #8FA3BF;">
        您没有访问该页面的权限，请联系管理员升级您的角色权限。
        <br />
        如您认为这是错误，请检查您的登录账号或联系系统管理员。
      </p>

      <div class="flex items-center gap-4 flex-wrap justify-center">
        <button
          class="btn-primary h-11 px-6 flex items-center gap-2 font-medium text-sm shadow-glow-blue"
          @click="goHome"
        >
          <Home class="w-4 h-4" />
          返回首页
        </button>
        <button
          class="btn-ghost h-11 px-6 flex items-center gap-2 font-medium text-sm border-danger-500/40 text-danger-400 hover:bg-danger-500/10 hover:border-danger-500/60"
          @click="logout"
        >
          <LogOut class="w-4 h-4" />
          退出登录
        </button>
      </div>

      <div class="mt-16 pt-6 border-t border-default/40 text-xs" style="color: #5C7799;">
        <div class="flex items-center justify-center gap-2">
          <ArrowLeft class="w-3 h-3" />
          <span>ErrorCode: 403_FORBIDDEN · RequestID: CC-{{ Math.random().toString(36).slice(2, 10).toUpperCase() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
