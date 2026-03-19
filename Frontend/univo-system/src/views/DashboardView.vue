<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Estadísticas generales — Arte, Cultura, Danza, Deporte y Pintura</p>
      </div>
      <button @click="loadStats" class="btn btn-ghost btn-sm">↻ Actualizar</button>
    </div>

    <div v-if="cargando" style="text-align:center;padding:3rem;color:var(--text-muted)">Cargando estadísticas...</div>

    <template v-else>
      <!-- KPIs principales -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.label" class="kpi-card" :style="`--acc:${kpi.color}`">
          <div class="kpi-icon">{{ kpi.icon }}</div>
          <div class="kpi-value">{{ kpi.value }}</div>
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-bar" :style="`background:${kpi.color}`"></div>
        </div>
      </div>

      <!-- Filtros del dashboard -->
      <div class="card" style="padding:1rem;margin-bottom:1.5rem">
        <div class="flex gap-2" style="flex-wrap:wrap;align-items:flex-end">
          <div class="form-group">
            <label class="form-label">Ver por</label>
            <select v-model="filtroGrupo" class="form-control">
              <option value="">Todas las áreas</option>
              <option value="Arte y Cultura">Arte y Cultura</option>
              <option value="Danza">Danza</option>
              <option value="Deporte">Deporte</option>
              <option value="Pintura">Pintura</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <select v-model="filtroSexo" class="form-control">
              <option value="">Todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Beca</label>
            <select v-model="filtroBecado" class="form-control">
              <option value="">Todos</option>
              <option value="true">Becados</option>
              <option value="false">No becados</option>
            </select>
          </div>
          <button @click="aplicarFiltros" class="btn btn-primary btn-sm" style="align-self:flex-end">Filtrar</button>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="charts-row">
        <!-- Por grupo -->
        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Estudiantes por Grupo</h3>
          <div class="chart-wrap"><Doughnut :data="grupoChart" :options="doughnutOpts"/></div>
          <div class="legend">
            <span v-for="(g,i) in gruposLegend" :key="g.label" class="legend-item">
              <span class="legend-dot" :style="`background:${g.color}`"></span>{{ g.label }}: {{ g.count }}
            </span>
          </div>
        </div>

        <!-- Por sexo -->
        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Género</h3>
          <div class="chart-wrap"><Doughnut :data="genChart" :options="doughnutOpts"/></div>
          <div class="legend">
            <span class="legend-item"><span class="legend-dot" style="background:#7c6af7"></span>Masculino: {{ stats.masculinos||0 }}</span>
            <span class="legend-item"><span class="legend-dot" style="background:#e85d75"></span>Femenino: {{ stats.femeninos||0 }}</span>
          </div>
        </div>

        <!-- Asistencias -->
        <div class="card chart-card">
          <h3 class="card-title" style="margin-bottom:1rem">Asistencias recientes</h3>
          <div class="chart-wrap"><Bar :data="barChart" :options="barOpts"/></div>
        </div>
      </div>

      <!-- Resumen por área detallado -->
      <div class="card" style="margin-bottom:1.5rem">
        <h3 class="card-title" style="margin-bottom:1rem">Distribución por Área</h3>
        <div class="areas-grid">
          <div v-for="(count, area) in stats.porArea" :key="area" class="area-item" v-show="count>0||mostrarTodas">
            <div class="area-nombre text-sm">{{ area }}</div>
            <div class="area-bar-wrap">
              <div class="area-bar" :style="`width:${getBarWidth(count)}%;background:${getAreaColor(area)}`"></div>
            </div>
            <span class="font-mono" style="font-size:.8rem;font-weight:700;min-width:24px;text-align:right">{{ count }}</span>
          </div>
        </div>
        <button @click="mostrarTodas=!mostrarTodas" class="btn btn-ghost btn-sm" style="margin-top:.75rem">
          {{ mostrarTodas?'Mostrar solo con datos':'Ver todas las áreas' }}
        </button>
      </div>

      <!-- Info rápida -->
      <div class="info-row">
        <div class="card">
          <h3 class="card-title" style="margin-bottom:1rem">Becados</h3>
          <div class="beca-stats">
            <div class="beca-item">
              <div class="beca-valor" style="color:var(--accent-deporte)">{{ stats.becados||0 }}</div>
              <div class="text-sm text-muted">Becados</div>
            </div>
            <div class="beca-sep"></div>
            <div class="beca-item">
              <div class="beca-valor" style="color:var(--text-secondary)">{{ stats.noBecados||0 }}</div>
              <div class="text-sm text-muted">No becados</div>
            </div>
            <div class="beca-sep"></div>
            <div class="beca-item">
              <div class="beca-valor" style="color:var(--accent-cultura)">{{ stats.totalEstudiantes||0 }}</div>
              <div class="text-sm text-muted">Total</div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom:1rem">Actividad del sistema</h3>
          <div class="mini-list">
            <div class="mini-item"><span class="text-sm">Asistencias hoy</span><span class="font-mono" style="color:var(--accent-deporte)">{{ stats.asistenciasHoy||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Préstamos activos</span><span class="font-mono" style="color:var(--accent-admin)">{{ stats.prestamosActivos||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Permisos pendientes</span><span class="font-mono" style="color:var(--accent-arte)">{{ stats.permisosPendientes||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Presentaciones</span><span class="font-mono" style="color:var(--accent-cultura)">{{ stats.totalPresentaciones||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Actividades</span><span class="font-mono" style="color:var(--accent-cultura)">{{ stats.totalActividades||0 }}</span></div>
            <div class="mini-item"><span class="text-sm">Recursos en inventario</span><span class="font-mono">{{ stats.totalRecursos||0 }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3 class="card-title" style="margin-bottom:1rem">Resumen por grupo</h3>
          <div class="area-summary">
            <div v-for="g in gruposLegend" :key="g.label" class="area-row">
              <div class="area-dot" :style="`background:${g.color}`"></div>
              <div style="flex:1">
                <div style="font-size:.82rem;margin-bottom:.25rem">{{ g.label }}</div>
                <div class="area-bar-wrap"><div class="area-bar" :style="`width:${g.pct}%;background:${g.color}`"></div></div>
              </div>
              <span class="font-mono" style="font-size:.85rem;font-weight:700">{{ g.count }}</span>
            </div>
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
import { getDashboardStats, getEstudiantes } from '../utils/db.js'
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

const stats    = ref({})
const cargando = ref(true)
const filtroGrupo  = ref('')
const filtroSexo   = ref('')
const filtroBecado = ref('')
const mostrarTodas = ref(false)

async function loadStats() {
  cargando.value=true
  stats.value = await getDashboardStats()
  cargando.value=false
}

async function aplicarFiltros() {
  cargando.value=true
  const f={}
  if (filtroGrupo.value)  f.grupo  =filtroGrupo.value
  if (filtroSexo.value)   f.sexo   =filtroSexo.value
  if (filtroBecado.value) f.becado =filtroBecado.value
  const est = await getEstudiantes(f)
  // Recalcular stats localmente con los filtros
  const porArea={}
  Object.keys(stats.value.porArea||{}).forEach(a=>porArea[a]=0)
  est.forEach(e=>{ if(porArea[e.area]!==undefined) porArea[e.area]++ })
  stats.value = {
    ...stats.value,
    totalEstudiantes: est.length,
    becados:   est.filter(e=>e.becado).length,
    noBecados: est.filter(e=>!e.becado).length,
    masculinos:est.filter(e=>e.sexo==='M').length,
    femeninos: est.filter(e=>e.sexo==='F').length,
    porArea,
    porGrupo: {
      'Arte y Cultura': est.filter(e=>['Solistas - Violinistas','Solistas - Saxofón','Solistas - Cantantes','Orquesta de Cámara','Grupo Andino','Mariachi','Marimba'].includes(e.area)).length,
      'Danza':          est.filter(e=>['Danza Latina','Ballet de Proyección Folklórica'].includes(e.area)).length,
      'Deporte':        est.filter(e=>['Fútbol 11','Fútbol Sala','Voleibol','Baloncesto','Natación','Ajedrez','Pingpong','Artes Marciales'].includes(e.area)).length,
      'Pintura':        est.filter(e=>e.area==='Taller de Pintura').length,
    }
  }
  cargando.value=false
}

onMounted(async()=>{ await loadStats() })

const gruposLegend = computed(() => {
  const pg=stats.value.porGrupo||{}
  const total=stats.value.totalEstudiantes||1
  return [
    { label:'Arte y Cultura', count:pg['Arte y Cultura']||0, color:'#7c6af7', pct:+((pg['Arte y Cultura']||0)/total*100).toFixed(0) },
    { label:'Danza',          count:pg['Danza']||0,          color:'#e85d75', pct:+((pg['Danza']||0)/total*100).toFixed(0) },
    { label:'Deporte',        count:pg['Deporte']||0,        color:'#3ecf8e', pct:+((pg['Deporte']||0)/total*100).toFixed(0) },
    { label:'Pintura',        count:pg['Pintura']||0,        color:'#f59e0b', pct:+((pg['Pintura']||0)/total*100).toFixed(0) },
  ]
})

const kpis = computed(() => [
  { label:'Total Estudiantes',  value:stats.value.totalEstudiantes||0,   icon:'◉', color:'#7c6af7' },
  { label:'Becados',            value:stats.value.becados||0,             icon:'★', color:'#3ecf8e' },
  { label:'Asistencias hoy',    value:stats.value.asistenciasHoy||0,      icon:'◎', color:'#3ecf8e' },
  { label:'Préstamos Activos',  value:stats.value.prestamosActivos||0,    icon:'◐', color:'#f59e0b' },
  { label:'Permisos Pendientes',value:stats.value.permisosPendientes||0,  icon:'◑', color:'#e85d75' },
  { label:'Total Actividades',  value:stats.value.totalActividades||0,    icon:'◆', color:'#7c6af7' },
])

const grupoChartColors = ['rgba(124,106,247,.85)','rgba(232,93,117,.85)','rgba(62,207,142,.85)','rgba(245,158,11,.85)']
const grupoChart = computed(() => ({
  labels: gruposLegend.value.map(g=>g.label),
  datasets:[{ data:gruposLegend.value.map(g=>g.count), backgroundColor:grupoChartColors, borderColor:['#7c6af7','#e85d75','#3ecf8e','#f59e0b'], borderWidth:2 }]
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

const tipT={ backgroundColor:'#1a1e2e', titleColor:'#e8eaf6', bodyColor:'#8b92b8', borderColor:'#252a3d', borderWidth:1 }
const doughnutOpts={ cutout:'68%', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:tipT} }
const barOpts={ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false},tooltip:tipT}, scales:{x:{grid:{color:'#252a3d'},ticks:{color:'#4a5080',font:{size:10}}},y:{grid:{color:'#252a3d'},ticks:{color:'#4a5080',font:{size:10}}}} }

const maxCount = computed(() => Math.max(...Object.values(stats.value.porArea||{1:1}), 1))
function getBarWidth(count) { return Math.round(count/maxCount.value*100) }
function getAreaColor(area) {
  if (['Danza Latina','Ballet de Proyección Folklórica'].includes(area)) return '#e85d75'
  if (['Fútbol 11','Fútbol Sala','Voleibol','Baloncesto','Natación','Ajedrez','Pingpong','Artes Marciales'].includes(area)) return '#3ecf8e'
  if (area==='Taller de Pintura') return '#f59e0b'
  return '#7c6af7'
}
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
.chart-wrap{height:200px;position:relative}
.legend{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:.75rem}
.legend-item{display:flex;align-items:center;gap:.4rem;font-size:.75rem;color:var(--text-secondary)}
.legend-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.info-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1.25rem}
@media(max-width:1000px){.info-row{grid-template-columns:1fr}}
.beca-stats{display:flex;align-items:center;justify-content:space-around;padding:1rem 0}
.beca-item{text-align:center}
.beca-valor{font-size:2.5rem;font-weight:700;font-family:var(--font-mono);line-height:1}
.beca-sep{width:1px;height:60px;background:var(--border)}
.mini-list{display:flex;flex-direction:column;gap:.5rem}
.mini-item{display:flex;justify-content:space-between;align-items:center;padding:.5rem .6rem;background:var(--bg-surface);border-radius:var(--radius-sm)}
.area-summary{display:flex;flex-direction:column;gap:.85rem}
.area-row{display:flex;align-items:center;gap:.75rem}
.area-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
.area-bar-wrap{height:5px;background:var(--bg-hover);border-radius:3px;overflow:hidden}
.area-bar{height:100%;border-radius:3px;transition:width .8s ease}
.areas-grid{display:flex;flex-direction:column;gap:.5rem}
.area-item{display:flex;align-items:center;gap:.75rem}
.area-nombre{min-width:200px;font-size:.82rem}
.area-bar-wrap{flex:1;height:6px;background:var(--bg-hover);border-radius:3px;overflow:hidden}
.area-bar{height:100%;border-radius:3px;transition:width .8s ease}
</style>