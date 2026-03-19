<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
    <div class="login-card fade-up">
      <div class="login-logo">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="16" fill="url(#lg)"/>
          <path d="M8 12h16M8 16h10M8 20h13" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7c6af7"/><stop offset="1" stop-color="#e85d75"/></linearGradient></defs>
        </svg>
        <div>
          <div class="logo-title">UNIVO</div>
          <div class="logo-sub">Sistema de Gestión ACyD</div>
        </div>
      </div>

      <h2 class="login-heading">Iniciar Sesión</h2>
      <p class="login-desc">Arte · Cultura · Danza · Deporte · Pintura</p>

      <div v-if="error" class="alert alert-error">{{ error }}</div>

      <div class="form-group">
        <label class="form-label">Correo Electrónico</label>
        <input v-model="form.email" type="email" class="form-control" placeholder="usuario@univo.edu" @keyup.enter="doLogin"/>
      </div>
      <div class="form-group" style="margin-top:1rem">
        <label class="form-label">Contraseña</label>
        <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" @keyup.enter="doLogin"/>
      </div>

      <button @click="doLogin" class="btn btn-primary login-btn" :disabled="loading">
        {{ loading?'Ingresando...':'Ingresar al Sistema' }}
      </button>

      <div class="login-hint">
        <details>
          <summary>Cuentas de acceso</summary>
          <div class="hint-table">
            <div v-for="u in hints" :key="u.email" class="hint-row" @click="fillLogin(u)">
              <span class="badge" :class="`badge-${u.color}`">{{ u.rol }}</span>
              <span class="text-sm">{{ u.email }}</span>
              <span class="text-muted text-xs">{{ u.pass }}</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'

const router = useRouter()
const auth   = useAuthStore()
const form   = ref({ email:'', password:'' })
const error  = ref('')
const loading= ref(false)

const hints = [
  { rol:'Admin',         color:'warning', email:'admin@univo.edu',       pass:'admin123'   },
  { rol:'Arte/Cultura',  color:'cultura', email:'artecultura@univo.edu', pass:'arte123'    },
  { rol:'Danza',         color:'arte',    email:'danza@univo.edu',        pass:'danza123'   },
  { rol:'Deporte',       color:'deporte', email:'deporte@univo.edu',      pass:'deporte123' },
  { rol:'Pintura',       color:'warning', email:'pintura@univo.edu',      pass:'pintura123' },
]

function fillLogin(u) { form.value.email=u.email; form.value.password=u.pass }

async function doLogin() {
  error.value=''; loading.value=true
  await new Promise(r=>setTimeout(r,400))
  const ok = await auth.login(form.value.email, form.value.password)
  loading.value=false
  if (ok) router.push('/dashboard')
  else error.value='Credenciales incorrectas.'
}
</script>

<style scoped>
.login-page{min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;background:var(--bg-base);padding:1rem}
.login-bg{position:absolute;inset:0;pointer-events:none}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.18}
.orb-1{width:500px;height:500px;background:var(--accent-cultura);top:-150px;left:-100px}
.orb-2{width:400px;height:400px;background:var(--accent-arte);bottom:-100px;right:-100px}
.orb-3{width:300px;height:300px;background:var(--accent-deporte);top:50%;left:50%;transform:translate(-50%,-50%)}
.login-card{position:relative;z-index:1;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-xl);padding:2.5rem;width:100%;max-width:420px;box-shadow:var(--shadow-lg)}
.login-logo{display:flex;align-items:center;gap:.85rem;margin-bottom:2rem}
.logo-title{font-size:1.1rem;font-weight:700;letter-spacing:.08em}
.logo-sub{font-size:.72rem;color:var(--text-muted)}
.login-heading{font-size:1.4rem;font-weight:700;margin-bottom:.25rem}
.login-desc{color:var(--text-secondary);font-size:.83rem;margin-bottom:1.75rem}
.login-btn{margin-top:1.5rem;padding:.75rem;font-size:.95rem;width:100%;justify-content:center}
.login-btn:disabled{opacity:.6;cursor:not-allowed}
.login-hint{margin-top:1.5rem;border-top:1px solid var(--border);padding-top:1rem}
.login-hint summary{font-size:.78rem;color:var(--text-muted);cursor:pointer;user-select:none}
.hint-table{margin-top:.75rem;display:flex;flex-direction:column;gap:.4rem}
.hint-row{display:flex;align-items:center;gap:.6rem;padding:.4rem .6rem;border-radius:var(--radius-sm);cursor:pointer;transition:var(--transition)}
.hint-row:hover{background:var(--bg-hover)}
</style>
