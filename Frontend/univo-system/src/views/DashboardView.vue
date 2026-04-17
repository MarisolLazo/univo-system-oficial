<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">{{ auth.isAdmin ? 'Resumen general — todas las áreas' : `Resumen — ${areaLabel}` }}</p>
      </div>
      <button @click="loadStats" class="btn btn-ghost btn-sm">↻ Actualizar</button>
    </div>

    <div v-if="cargando" style="text-align:center;padding:3rem;color:var(--text-muted)">Cargando...</div>

    <template v-else>
      <!-- KPIs -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card" :style="`--acc:${kpi.color}`">
          <div class="kpi-icon">{{ kpi.icon }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-bar" :style="`background:${kpi.color}`"></div>
        </div>
      </div>

      <!-- Fila principal: gráficos -->
      <div class="charts-row">
        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Estudiantes por Subárea</h3>
          <div class="chart-wrap"><Doughnut :data="areaChart" :options="doughnutOpts"/></div>
          <div class="legend">
            <span v-for="(item,i) in legendItems" :key="item.label" class="legend-item">
              <span class="legend-dot" :style="`background:${chartColors[i%chartColors.length]}`"></span>
              {{ item.label }}: {{ item.count }}
            </span>
          </div>
        </div>

        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Género</h3>
          <div class="chart-wrap"><Doughnut :data="genChart" :options="doughnutOpts"/></div>
          <div class="legend">
            <span class="legend-item"><span class="legend-dot" style="background:#7c6af7"></span>Masculino: {{ stats.masculinos||0 }}</span>
            <span class="legend-item"><span class="legend-dot" style="background:#e85d75"></span>Femenino: {{ stats.femeninos||0 }}</span>
          </div>
          <!-- Becados debajo del género -->
          <hr class="divider" style="margin:1rem 0"/>
          <div class="beca-mini">
            <div class="beca-mini-item">
              <span class="beca-num" style="color:var(--accent-deporte)">{{ stats.becados||0 }}</span>
              <span class="text-xs text-muted">Becados</span>
            </div>
            <div class="beca-sep-v"></div>
            <div class="beca-mini-item">
              <span class="beca-num" style="color:var(--text-secondary)">{{ stats.noBecados||0 }}</span>
              <span class="text-xs text-muted">No becados</span>
            </div>
            <div class="beca-sep-v"></div>
            <div class="beca-mini-item">
              <span class="beca-num" style="color:var(--accent-cultura)">{{ stats.totalEstudiantes||0 }}</span>
              <span class="text-xs text-muted">Total</span>
            </div>
          </div>
        </div>

        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Asistencias recientes</h3>
          <div class="chart-wrap"><Bar :data="barChart" :options="barOpts"/></div>
          <hr class="divider" style="margin:1rem 0"/>
          <div class="mini-list">
            <div class="mini-item"><span class="text-sm">Asistencias hoy</span><span class="font-mono" style="color:var(--accent-deporte)">{{ stats.asistenciasHoy||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Préstamos activos</span><span class="font-mono" style="color:var(--accent-admin)">{{ stats.prestamosActivos||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Permisos pendientes</span><span class="font-mono" style="color:var(--accent-arte)">{{ stats.permisosPendientes||0 }}</span></div>
          </div>
        </div>
      </div>

      <!-- Segunda fila: cumpleaños + distribución -->
      <div class="segunda-fila">

        <!-- Calendario de cumpleaños -->
        <div class="card cumple-card">
          <div class="cumple-header">
            <h3 class="card-title">🎂 Cumpleaños</h3>
            <div class="cumple-tabs">
              <button @click="cumpleTab='hoy'"   :class="['cumple-tab', cumpleTab==='hoy'?'active':'']">Hoy</button>
              <button @click="cumpleTab='semana'" :class="['cumple-tab', cumpleTab==='semana'?'active':'']">Esta semana</button>
              <button @click="cumpleTab='mes'"    :class="['cumple-tab', cumpleTab==='mes'?'active':'']">Este mes</button>
            </div>
          </div>

          <div v-if="!cumpleActivos.length" class="empty-state" style="padding:1.5rem">
            <div class="icon">🎉</div>
            <p>Sin cumpleaños {{ cumpleTab==='hoy'?'hoy':cumpleTab==='semana'?'esta semana':'este mes' }}</p>
          </div>
          <div v-else class="cumple-list">
            <div v-for="e in cumpleActivos" :key="e.id" class="cumple-item">
              <div class="cumple-avatar" :class="badgeArea(e.area)">
                {{ e.nombre.split(' ').map(w=>w[0]).slice(0,2).join('') }}
              </div>
              <div class="cumple-info">
                <div class="cumple-nombre">{{ e.nombre }}</div>
                <div class="cumple-sub text-xs text-muted">{{ e.area }} · {{ formatCumple(e.fechaNacimiento) }}</div>
              </div>
              <div class="cumple-edad font-mono text-sm" style="color:var(--accent-admin)">
                {{ calcEdad(e.fechaNacimiento) }} años
              </div>
            </div>
          </div>
        </div>

        <!-- Distribución por subárea -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom:1rem">Distribución por Subárea</h3>
          <div class="area-summary">
            <div v-for="(item,i) in legendItems" :key="item.label" class="area-row">
              <div class="area-dot" :style="`background:${chartColors[i%chartColors.length]}`"></div>
              <div style="flex:1">
                <div style="font-size:.78rem;margin-bottom:.2rem">{{ item.label }}</div>
                <div class="area-bar-wrap">
                  <div class="area-bar" :style="`width:${item.pct}%;background:${chartColors[i%chartColors.length]}`"></div>
                </div>
              </div>
              <span class="font-mono" style="font-size:.82rem;font-weight:700;min-width:24px;text-align:right">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <!-- Actividad rápida -->
        <div class="card">
          <h3 class="card-title" style="margin-bottom:1rem">Actividad del sistema</h3>
          <div class="mini-list">
            <div class="mini-item"><span class="text-sm">Total presentaciones</span><span class="font-mono" style="color:var(--accent-cultura)">{{ stats.totalPresentaciones||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Total actividades</span><span class="font-mono" style="color:var(--accent-cultura)">{{ stats.totalActividades||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Recursos inventario</span><span class="font-mono">{{ stats.totalRecursos||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Total asistencias</span><span class="font-mono">{{ stats.totalAsistencias||0 }}</span></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { getDashboardStats, getEstudiantes, AREAS_ARTE_CULTURA, AREAS_DANZA, AREAS_DEPORTE, AREAS_PINTURA, TODAS_AREAS } from '../utils/db.js'
import { useAuthStore } from '../store/auth.js'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const auth     = useAuthStore()
const stats    = ref({})
const todos    = ref([]) // todos los estudiantes del área para cumpleaños
const cargando = ref(true)
const cumpleTab= ref('mes')

const misAreas = computed(() => {
  if (auth.isAdmin)                       return null
  if (auth.userArea==='Arte y Cultura')   return AREAS_ARTE_CULTURA
  if (auth.userArea==='Danza')            return AREAS_DANZA
  if (auth.userArea==='Deporte')          return AREAS_DEPORTE
  if (auth.userArea==='Pintura')          return AREAS_PINTURA
  return []
})

const areaLabel = computed(() => auth.userArea||'')

async function loadStats() {
  cargando.value=true
  const f={}
  if (!auth.isAdmin && auth.userArea) f.grupo=auth.userArea
  const estudiantes = await getEstudiantes(f)
  todos.value = estudiantes

  const areas = misAreas.value || TODAS_AREAS
  const porArea={}
  areas.forEach(a=>{ porArea[a]=estudiantes.filter(e=>e.area===a).length })

  stats.value = {
    totalEstudiantes: estudiantes.length,
    becados:          estudiantes.filter(e=>e.becado).length,
    noBecados:        estudiantes.filter(e=>!e.becado).length,
    masculinos:       estudiantes.filter(e=>e.sexo==='M').length,
    femeninos:        estudiantes.filter(e=>e.sexo==='F').length,
    porArea,
    ...(await getDashboardStats()),
  }
  cargando.value=false
}

onMounted(async()=>{ await loadStats() })

// ── Cumpleaños ────────────────────────────────────────────
const cumpleActivos = computed(() => {
  const hoy   = new Date()
  const mes   = hoy.getMonth()
  const dia   = hoy.getDate()

  return todos.value.filter(e => {
    if (!e.fechaNacimiento) return false
    const fn  = new Date(e.fechaNacimiento)
    const fMes= fn.getMonth()
    const fDia= fn.getDate()

    if (cumpleTab.value==='hoy') {
      return fMes===mes && fDia===dia
    }
    if (cumpleTab.value==='semana') {
      const inicioSemana = new Date(hoy); inicioSemana.setDate(dia - hoy.getDay())
      const finSemana    = new Date(inicioSemana); finSemana.setDate(inicioSemana.getDate()+6)
      const fnEsteAnio   = new Date(hoy.getFullYear(), fMes, fDia)
      return fnEsteAnio >= inicioSemana && fnEsteAnio <= finSemana
    }
    if (cumpleTab.value==='mes') {
      return fMes===mes
    }
    return false
  }).sort((a,b) => {
    const da = new Date(a.fechaNacimiento).getDate()
    const db2= new Date(b.fechaNacimiento).getDate()
    return da - db2
  })
})

function calcEdad(fecha) {
  if (!fecha) return '?'
  const hoy = new Date()
  const fn  = new Date(fecha)
  let edad  = hoy.getFullYear() - fn.getFullYear()
  const m   = hoy.getMonth() - fn.getMonth()
  if (m < 0 || (m===0 && hoy.getDate() < fn.getDate())) edad--
  return edad
}

function formatCumple(fecha) {
  if (!fecha) return ''
  const fn = new Date(fecha)
  return fn.toLocaleDateString('es-SV', { day:'numeric', month:'long' })
}

function badgeArea(area) {
  if (['Danza Latina','Ballet de Proyección Folklórica'].includes(area)) return 'avatar-arte'
  if (['Fútbol 11','Fútbol Sala','Voleibol','Baloncesto','Natación','Ajedrez','Pingpong','Artes Marciales'].includes(area)) return 'avatar-deporte'
  if (area==='Taller de Pintura') return 'avatar-warning'
  return 'avatar-cultura'
}

// ── Gráficos ──────────────────────────────────────────────
const chartColors = ['#7c6af7','#e85d75','#3ecf8e','#f59e0b','#38bdf8','#a78bfa','#fb923c','#34d399','#f472b6','#60a5fa','#facc15','#4ade80']

const legendItems = computed(() => {
  const pa    = stats.value.porArea || {}
  const total = stats.value.totalEstudiantes || 1
  const areas = misAreas.value || Object.keys(pa)
  return areas.map(area => ({
    label: area,
    count: pa[area]||0,
    pct:   +((( pa[area]||0)/total)*100).toFixed(0)
  }))
})

const areaChart = computed(() => ({
  labels: legendItems.value.map(i=>i.label),
  datasets:[{
    data: legendItems.value.map(i=>i.count),
    backgroundColor: legendItems.value.map((_,i)=>{
      const c=chartColors[i%chartColors.length]
      return c+'cc'
    }),
    borderColor: legendItems.value.map((_,i)=>chartColors[i%chartColors.length]),
    borderWidth:2
  }]
}))

const genChart = computed(() => ({
  labels:['Masculino','Femenino'],
  datasets:[{ data:[stats.value.masculinos||0,stats.value.femeninos||0], backgroundColor:['rgba(124,106,247,.85)','rgba(232,93,117,.85)'], borderColor:['#7c6af7','#e85d75'], borderWidth:2 }]
}))

const last7=Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(6-i)); return d.toLocaleDateString('es-SV',{weekday:'short',day:'numeric'}) })
const barChart = computed(() => ({
  labels:last7,
  datasets:[{ label:'Presentes', data:[0,0,0,0,0,0,stats.value.presentesHoy||0], backgroundColor:'rgba(62,207,142,.7)', borderColor:'#3ecf8e', borderWidth:2, borderRadius:6 }]
}))

const kpis = computed(() => [
  { label:'Total Estudiantes',   value:stats.value.totalEstudiantes||0,   icon:'◉', color:'#7c6af7' },
  { label:'Becados',             value:stats.value.becados||0,             icon:'★', color:'#3ecf8e' },
  { label:'Asistencias hoy',     value:stats.value.asistenciasHoy||0,      icon:'◎', color:'#3ecf8e' },
  { label:'Préstamos Activos',   value:stats.value.prestamosActivos||0,    icon:'◐', color:'#f59e0b' },
  { label:'Permisos Pendientes', value:stats.value.permisosPendientes||0,  icon:'◑', color:'#e85d75' },
  { label:'Actividades',         value:stats.value.totalActividades||0,    icon:'◆', color:'#7c6af7' },
])

const tipT={backgroundColor:'#1a1e2e',titleColor:'#e8eaf6',bodyColor:'#8b92b8',borderColor:'#252a3d',borderWidth:1}
const doughnutOpts={cutout:'68%',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tipT}}
const barOpts={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:tipT},scales:{x:{grid:{color:'#252a3d'},ticks:{color:'#4a5080',font:{size:10}}},y:{grid:{color:'#252a3d'},ticks:{color:'#4a5080',font:{size:10}}}}}
</script>

<style scoped>
.kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:1rem;margin-bottom:1.5rem}
@media(max-width:1200px){.kpi-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:600px){.kpi-grid{grid-template-columns:repeat(2,1fr)}}
.kpi-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1rem;position:relative;overflow:hidden;transition:var(--transition)}
.kpi-card:hover{border-color:var(--border-light);transform:translateY(-2px)}
.kpi-icon{font-size:1.2rem;color:var(--acc);margin-bottom:.6rem}
.kpi-value{font-size:2rem;font-weight:700;font-family:var(--font-mono);line-height:1;margin-bottom:.35rem}
.kpi-label{font-size:.76rem;color:var(--text-secondary);line-height:1.3}
.kpi-bar{position:absolute;bottom:0;left:0;right:0;height:3px;opacity:.6}

.charts-row{display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:1.25rem;margin-bottom:1.5rem}
@media(max-width:1000px){.charts-row{grid-template-columns:1fr}}
.chart-card{min-height:300px}
.card-title{font-size:.9rem;font-weight:600}
.chart-wrap{height:180px;position:relative}
.legend{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
.legend-item{display:flex;align-items:center;gap:.35rem;font-size:.72rem;color:var(--text-secondary)}
.legend-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}

.beca-mini{display:flex;align-items:center;justify-content:space-around;padding:.25rem 0}
.beca-mini-item{text-align:center;display:flex;flex-direction:column;align-items:center;gap:.2rem}
.beca-num{font-size:1.5rem;font-weight:700;font-family:var(--font-mono);line-height:1}
.beca-sep-v{width:1px;height:36px;background:var(--border)}

.segunda-fila{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:1.25rem;margin-bottom:1.5rem}
@media(max-width:1000px){.segunda-fila{grid-template-columns:1fr}}

/* Cumpleaños */
.cumple-card{}
.cumple-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;flex-wrap:wrap;gap:.5rem}
.cumple-tabs{display:flex;gap:.35rem}
.cumple-tab{padding:.3rem .7rem;border-radius:var(--radius-sm);border:1px solid var(--border);background:none;color:var(--text-secondary);font-size:.75rem;cursor:pointer;transition:var(--transition)}
.cumple-tab.active{background:var(--accent-cultura);color:white;border-color:var(--accent-cultura)}
.cumple-tab:hover:not(.active){background:var(--bg-hover);color:var(--text-primary)}
.cumple-list{display:flex;flex-direction:column;gap:.6rem;max-height:320px;overflow-y:auto}
.cumple-item{display:flex;align-items:center;gap:.75rem;padding:.6rem .75rem;background:var(--bg-surface);border-radius:var(--radius-md);border:1px solid var(--border)}
.cumple-avatar{width:36px;height:36px;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.8rem;flex-shrink:0}
.avatar-arte{background:rgba(232,93,117,.2);color:var(--accent-arte)}
.avatar-cultura{background:rgba(124,106,247,.2);color:var(--accent-cultura)}
.avatar-deporte{background:rgba(62,207,142,.2);color:var(--accent-deporte)}
.avatar-warning{background:rgba(245,158,11,.2);color:var(--accent-admin)}
.cumple-info{flex:1;min-width:0}
.cumple-nombre{font-size:.85rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cumple-sub{margin-top:.1rem}

.area-summary{display:flex;flex-direction:column;gap:.7rem;max-height:300px;overflow-y:auto}
.area-row{display:flex;align-items:center;gap:.75rem}
.area-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0}
.area-bar-wrap{height:5px;background:var(--bg-hover);border-radius:3px;overflow:hidden}
.area-bar{height:100%;border-radius:3px;transition:width .8s ease}

.mini-list{display:flex;flex-direction:column;gap:.5rem}
.mini-item{display:flex;justify-content:space-between;align-items:center;padding:.5rem .6rem;background:var(--bg-surface);border-radius:var(--radius-sm)}
</style>