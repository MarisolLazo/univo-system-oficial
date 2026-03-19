<template>
  <div class="layout">
    <aside class="sidebar" :class="{'sidebar-open':sidebarOpen}">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="url(#lg)"/>
            <path d="M8 12h16M8 16h10M8 20h13" stroke="white" stroke-width="2" stroke-linecap="round"/>
            <defs><linearGradient id="lg" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#7c6af7"/><stop offset="1" stop-color="#e85d75"/></linearGradient></defs>
          </svg>
          <div class="logo-text">
            <span class="logo-name">UNIVO</span>
            <span class="logo-version">ACyD v2.0</span>
          </div>
        </div>
        <button class="btn-icon" @click="sidebarOpen=false" style="display:none" ref="closeBtn">✕</button>
      </div>

      <div class="sidebar-user">
        <div class="user-avatar" :class="`avatar-${rolColor}`">{{ initials }}</div>
        <div>
          <div class="user-name">{{ auth.userName }}</div>
          <span class="badge" :class="`badge-${rolColor}`">{{ auth.isAdmin ? 'Admin' : auth.userArea }}</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Principal</div>
          <RouterLink to="/dashboard"   class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">◈</span>Dashboard</RouterLink>
          <RouterLink to="/estudiantes" class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">◉</span>Estudiantes</RouterLink>
          <RouterLink to="/asistencias" class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">◎</span>Asistencias</RouterLink>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Gestión</div>
          <RouterLink to="/actividades"    class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">◆</span>Actividades</RouterLink>
          <RouterLink to="/presentaciones" class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">◇</span>Presentaciones</RouterLink>
          <RouterLink to="/recursos"       class="nav-item" @click="sidebarOpen=false"><span class="nav-icon">▣</span>Inventario</RouterLink>
          <RouterLink to="/prestamos"      class="nav-item" @click="sidebarOpen=false">
            <span class="nav-icon">◐</span>Préstamos
            <span v-if="stats.prestamosActivos" class="nav-badge">{{ stats.prestamosActivos }}</span>
          </RouterLink>
          <RouterLink to="/permisos"       class="nav-item" @click="sidebarOpen=false">
            <span class="nav-icon">◑</span>Permisos
            <span v-if="stats.permisosPendientes" class="nav-badge">{{ stats.permisosPendientes }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button @click="logout" class="btn-logout">⬡ Cerrar Sesión</button>
      </div>
    </aside>

    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen=false"></div>

    <div class="main-content">
      <header class="topbar">
        <button class="btn-icon" @click="sidebarOpen=true">☰</button>
        <div class="topbar-title">{{ pageTitle }}</div>
        <div class="font-mono text-sm text-muted">{{ currentDate }}</div>
      </header>
      <main class="page-content">
        <RouterView v-slot="{Component}">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="$route.path"/>
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'
import { getDashboardStats } from '../utils/db.js'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
dayjs.locale('es')

const auth   = useAuthStore()
const route  = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const stats  = ref({ prestamosActivos:0, permisosPendientes:0 })

onMounted(async () => { stats.value = await getDashboardStats() })

const rolColor = computed(() => ({ 'Arte y Cultura':'cultura','Danza':'arte','Deporte':'deporte','Pintura':'warning' }[auth.userArea]||'warning'))
const initials = computed(() => auth.userName?.split(' ').map(w=>w[0]).slice(0,2).join('')||'?')
const currentDate = computed(() => dayjs().format('ddd DD MMM YYYY'))
const pageMap = { '/dashboard':'Dashboard','/estudiantes':'Estudiantes','/asistencias':'Asistencias','/actividades':'Actividades','/presentaciones':'Presentaciones','/recursos':'Inventario','/prestamos':'Préstamos','/permisos':'Permisos' }
const pageTitle = computed(() => pageMap[route.path]||'Panel')

function logout() { auth.logout(); router.push('/login') }
</script>

<style scoped>
.layout{display:flex;min-height:100vh}
.sidebar{width:248px;min-width:248px;background:var(--bg-surface);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto;transition:transform .3s ease}
.sidebar-header{padding:1.25rem 1.25rem 1rem;display:flex;align-items:center;justify-content:space-between}
.sidebar-logo{display:flex;align-items:center;gap:.65rem}
.logo-text{display:flex;flex-direction:column}
.logo-name{font-weight:700;font-size:.95rem;letter-spacing:.06em}
.logo-version{font-size:.65rem;color:var(--text-muted);font-family:var(--font-mono)}
.sidebar-user{margin:0 1rem 1rem;padding:.85rem;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;gap:.75rem}
.user-avatar{width:38px;height:38px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem}
.avatar-arte{background:rgba(232,93,117,.2);color:var(--accent-arte)}
.avatar-cultura{background:rgba(124,106,247,.2);color:var(--accent-cultura)}
.avatar-deporte{background:rgba(62,207,142,.2);color:var(--accent-deporte)}
.avatar-warning{background:rgba(245,158,11,.2);color:var(--accent-admin)}
.user-name{font-size:.82rem;font-weight:600;margin-bottom:.2rem}
.sidebar-nav{flex:1;padding:0 .75rem}
.nav-section{margin-bottom:1.5rem}
.nav-section-title{font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--text-muted);padding:0 .6rem;margin-bottom:.4rem}
.nav-item{display:flex;align-items:center;gap:.65rem;padding:.6rem .8rem;border-radius:var(--radius-sm);color:var(--text-secondary);font-size:.87rem;font-weight:500;transition:var(--transition);margin-bottom:.15rem;text-decoration:none}
.nav-item:hover{background:var(--bg-hover);color:var(--text-primary)}
.nav-item.router-link-active{background:rgba(124,106,247,.12);color:var(--accent-cultura)}
.nav-icon{font-size:.9rem;width:18px;text-align:center}
.nav-badge{margin-left:auto;background:var(--accent-arte);color:white;font-size:.65rem;font-weight:700;padding:.1rem .45rem;border-radius:999px;font-family:var(--font-mono)}
.sidebar-footer{padding:1rem;border-top:1px solid var(--border)}
.btn-logout{width:100%;display:flex;align-items:center;gap:.5rem;padding:.6rem .8rem;background:none;border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-secondary);font-size:.85rem;cursor:pointer;transition:var(--transition)}
.btn-logout:hover{border-color:var(--accent-arte);color:var(--accent-arte)}
.main-content{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{height:56px;background:var(--bg-surface);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:1rem;padding:0 1.5rem;position:sticky;top:0;z-index:100}
.topbar-title{font-size:.9rem;font-weight:600;flex:1}
.page-content{flex:1;padding:2rem 1.5rem;max-width:1400px}
.page-enter-active,.page-leave-active{transition:opacity .18s ease,transform .18s ease}
.page-enter-from{opacity:0;transform:translateY(8px)}
.page-leave-to{opacity:0;transform:translateY(-4px)}
.sidebar-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:199}
@media(max-width:900px){
  .sidebar{position:fixed;top:0;left:0;bottom:0;z-index:200;transform:translateX(-100%)}
  .sidebar.sidebar-open{transform:translateX(0)}
  .sidebar-overlay{display:block}
  .page-content{padding:1.25rem 1rem}
}
</style>