<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  User,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  ThermometerSnowflake,
  BarChart3,
  FileCheck,
  TrendingUp,
  Loader2,
} from 'lucide-vue-next'

const router = useRouter()
const userStore = useUserStore()

type RoleTab = 'national' | 'province' | 'city'
const roleTabs: { key: RoleTab; label: string; level: 1 | 2 | 3 }[] = [
  { key: 'national', label: '国家级', level: 1 },
  { key: 'province', label: '省级', level: 2 },
  { key: 'city', label: '市/点级', level: 3 },
]
const activeRole = ref<RoleTab>('national')

const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const captchaCode = ref('')
const captchaCanvas = ref<HTMLCanvasElement | null>(null)

const form = reactive({
  username: '',
  password: '',
  captcha: '',
  remember: true,
})

const features = [
  { icon: ThermometerSnowflake, title: '实时冷链监测', desc: '24小时不间断温度追踪', color: 'primary' },
  { icon: BarChart3, title: '智能预测预警', desc: 'AI驱动的风险预判', color: 'warning' },
  { icon: FileCheck, title: '三级审批流程', desc: '规范化预警处置闭环', color: 'success' },
  { icon: TrendingUp, title: '数据驱动决策', desc: '多维度可视化分析', color: 'primary' },
]

const floatBubbles = [
  { size: 200, color: 'primary', top: '10%', left: '8%', delay: '0s' },
  { size: 140, color: 'warning', top: '65%', left: '20%', delay: '1s' },
  { size: 180, color: 'success', top: '25%', right: '35%', delay: '2s' },
  { size: 120, color: 'primary', top: '75%', right: '12%', delay: '0.5s' },
  { size: 90, color: 'warning', top: '45%', right: '50%', delay: '1.5s' },
]

const testAccounts = [
  { username: 'admin_national', password: '123456', label: '国家级管理员' },
  { username: 'admin_beijing', password: '123456', label: '省级管理员' },
  { username: 'cold_zhangsan', password: '123456', label: '冷链管理员' },
  { username: 'vaccinate_lisi', password: '123456', label: '接种点管理员' },
]

function generateCaptcha() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  captchaCode.value = code
  drawCaptcha(code)
}

function drawCaptcha(code: string) {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height

  ctx.fillStyle = 'rgba(24, 144, 255, 0.08)'
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 5; i++) {
    ctx.strokeStyle = `rgba(24, 144, 255, ${0.15 + Math.random() * 0.2})`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.lineTo(Math.random() * w, Math.random() * h)
    ctx.stroke()
  }

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(24, 144, 255, ${0.2 + Math.random() * 0.4})`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const colors = ['#1890FF', '#52C41A', '#FAAD14', '#F5222D', '#722ED1']
  ctx.font = 'bold 22px Rajdhani, system-ui, sans-serif'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < code.length; i++) {
    const x = 14 + i * 24
    const y = h / 2 + (Math.random() - 0.5) * 6
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((Math.random() - 0.5) * 0.4)
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }
}

function refreshCaptcha() {
  generateCaptcha()
  form.captcha = ''
}

function fillTestAccount(account: { username: string; password: string }) {
  form.username = account.username
  form.password = account.password
  if (account.username.includes('national')) activeRole.value = 'national'
  else if (account.username.includes('beijing') || account.username.includes('shanghai')) activeRole.value = 'province'
  else activeRole.value = 'city'
  errorMsg.value = ''
}

const canSubmit = computed(() => {
  return form.username.trim() && form.password.trim() && form.captcha.trim()
})

async function handleLogin() {
  if (!canSubmit.value) {
    errorMsg.value = '请完整填写所有字段'
    return
  }

  if (form.captcha.toUpperCase() !== captchaCode.value.toUpperCase()) {
    errorMsg.value = '验证码不正确'
    generateCaptcha()
    form.captcha = ''
    return
  }

  isLoading.value = true
  errorMsg.value = ''

  try {
    const level = roleTabs.find((r) => r.key === activeRole.value)!.level
    const { token, userInfo } = await userStore.login({
      username: form.username.trim(),
      password: form.password,
      level,
    })

    if (token) {
      if (form.remember) {
        localStorage.setItem('vaccine_login_form', JSON.stringify({ username: form.username }))
      } else {
        localStorage.removeItem('vaccine_login_form')
      }
      router.push('/dashboard')
    } else {
      errorMsg.value = '用户名或密码错误，请检查测试账号'
      generateCaptcha()
      form.captcha = ''
    }
  } catch (e) {
    errorMsg.value = '登录失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  generateCaptcha()
  const saved = localStorage.getItem('vaccine_login_form')
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.username) form.username = data.username
    } catch {
      // ignore
    }
  }
})
</script>

<template>
  <div class="relative min-h-screen w-full overflow-hidden bg-bg-primary">
    <div
      class="absolute inset-0 tech-grid"
      style="background-image:
        radial-gradient(ellipse at 20% 30%, rgba(24, 144, 255, 0.18) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(82, 196, 26, 0.10) 0%, transparent 55%),
        radial-gradient(ellipse at 50% 100%, rgba(250, 173, 20, 0.08) 0%, transparent 60%);"
    ></div>

    <div
      v-for="(b, idx) in floatBubbles"
      :key="idx"
      class="absolute rounded-full blur-3xl opacity-30 animate-float"
      :class="[
        b.color === 'primary' ? 'bg-primary-500' : '',
        b.color === 'warning' ? 'bg-warning-500' : '',
        b.color === 'success' ? 'bg-success-500' : '',
      ]"
      :style="{
        width: `${b.size}px`,
        height: `${b.size}px`,
        top: b.top,
        left: b.left,
        right: b.right,
        animationDelay: b.delay,
      }"
    ></div>

    <div class="relative z-10 flex min-h-screen">
      <div class="hidden lg:flex w-[55%] flex-col justify-between p-12 xl:p-16">
        <div class="animate-fade-in-up" style="animation-delay: 0.1s">
          <div class="flex items-center gap-3 mb-10">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-glow-blue">
              <ShieldCheck class="w-7 h-7 text-white" />
            </div>
            <span class="font-rajdhani font-bold text-2xl text-primary-300">VacChain Monitor</span>
          </div>

          <h1 class="font-rajdhani font-bold text-4xl xl:text-5xl text-primary leading-tight mb-4">
            全国疫苗冷链与免疫规划
            <br />
            <span class="bg-gradient-to-r from-primary-300 via-primary-500 to-success-400 bg-clip-text text-transparent">
              智能监测分析平台
            </span>
          </h1>
          <p class="text-text-secondary text-lg mb-12">守护每一支疫苗的安全旅程</p>

          <div class="grid grid-cols-2 gap-4 max-w-xl">
            <div
              v-for="(f, i) in features"
              :key="f.title"
              class="panel p-5 animate-fade-in-up"
              :style="{ animationDelay: `${0.2 + i * 0.1}s` }"
            >
              <div
                class="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
                :class="[
                  f.color === 'primary' ? 'bg-primary-500/15 text-primary-400' : '',
                  f.color === 'warning' ? 'bg-warning-500/15 text-warning-400' : '',
                  f.color === 'success' ? 'bg-success-500/15 text-success-400' : '',
                ]"
              >
                <component :is="f.icon" class="w-5 h-5" />
              </div>
              <div class="text-text-primary font-bold mb-1">{{ f.title }}</div>
              <div class="text-text-tertiary text-sm">{{ f.desc }}</div>
            </div>
          </div>
        </div>

        <div class="text-text-tertiary text-sm animate-fade-in-up" style="animation-delay: 0.8s">
          <div class="flex items-center gap-2 mb-2">
            <div class="w-2 h-2 rounded-full bg-success-400 animate-pulse"></div>
            <span>系统运行正常 · 全国31个省级节点在线</span>
          </div>
          <div>© 2025 国家疾控中心 疫苗冷链监测系统 v2.5.1</div>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div class="panel shadow-glow-blue w-full max-w-[420px] p-8 animate-fade-in-up" style="animation-delay: 0.3s">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-text-primary mb-2">欢迎登录</h2>
            <p class="text-text-tertiary text-sm">请选择角色并填写账号信息</p>
          </div>

          <div class="flex gap-2 mb-6 p-1 bg-bg-secondary rounded-lg border border-default">
            <button
              v-for="tab in roleTabs"
              :key="tab.key"
              class="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
              :class="[
                activeRole === tab.key
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-glow-blue'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/50',
              ]"
              @click="activeRole = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div>
              <label class="block text-sm text-text-secondary mb-2">用户名</label>
              <div class="relative">
                <User class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  v-model="form.username"
                  type="text"
                  placeholder="请输入用户名"
                  autocomplete="username"
                  class="w-full h-11 pl-10 pr-4 bg-bg-secondary border border-default rounded-lg text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500 focus:shadow-glow-blue transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-2">密码</label>
              <div class="relative">
                <Lock class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                  class="w-full h-11 pl-10 pr-11 bg-bg-secondary border border-default rounded-lg text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500 focus:shadow-glow-blue transition-all duration-200"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                  @click="showPassword = !showPassword"
                >
                  <Eye v-if="!showPassword" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm text-text-secondary mb-2">图形验证码</label>
              <div class="flex gap-3">
                <div class="relative flex-1">
                  <input
                    v-model="form.captcha"
                    type="text"
                    maxlength="4"
                    placeholder="请输入4位验证码"
                    class="w-full h-11 px-4 bg-bg-secondary border border-default rounded-lg text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-primary-500 focus:shadow-glow-blue transition-all duration-200 uppercase tracking-wider"
                  />
                </div>
                <button
                  type="button"
                  class="relative w-[110px] h-11 rounded-lg overflow-hidden border border-default bg-bg-secondary hover:border-primary-500/50 transition-colors group"
                  @click="refreshCaptcha"
                  title="点击刷新验证码"
                >
                  <canvas ref="captchaCanvas" width="110" height="44" class="w-full h-full cursor-pointer"></canvas>
                  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <RefreshCw class="w-4 h-4 text-white" />
                  </div>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input
                  v-model="form.remember"
                  type="checkbox"
                  class="w-4 h-4 rounded border-default bg-bg-secondary text-primary-500 focus:ring-primary-500/30 focus:ring-2"
                />
                <span class="text-sm text-text-secondary">记住我</span>
              </label>
              <a href="#" class="text-sm text-primary-400 hover:text-primary-300 transition-colors">忘记密码？</a>
            </div>

            <div
              v-if="errorMsg"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in-up"
            >
              <span>{{ errorMsg }}</span>
            </div>

            <button
              type="submit"
              :disabled="isLoading || !canSubmit"
              class="btn-primary w-full h-11 font-medium flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
              <span>{{ isLoading ? '登录中...' : '立即登录' }}</span>
            </button>
          </form>

          <div class="mt-6 pt-5 border-t border-default">
            <div class="flex items-center gap-2 mb-3">
              <div class="flex-1 h-px bg-default"></div>
              <span class="text-xs text-text-tertiary">测试账号（点击快速填入）</span>
              <div class="flex-1 h-px bg-default"></div>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="acc in testAccounts"
                :key="acc.username"
                type="button"
                class="px-3 py-2 text-left rounded-lg bg-bg-secondary border border-default hover:border-primary-500/50 hover:bg-bg-tertiary/50 transition-all duration-200 group"
                @click="fillTestAccount(acc)"
              >
                <div class="text-xs text-text-primary font-medium group-hover:text-primary-300 transition-colors">
                  {{ acc.label }}
                </div>
                <div class="text-[11px] text-text-tertiary font-mono mt-0.5">{{ acc.username }} / 123456</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
