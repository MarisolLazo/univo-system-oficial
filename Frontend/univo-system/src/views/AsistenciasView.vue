<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Control de Asistencias</h1><p class="page-subtitle">Registro masivo por área y actividad</p></div>
      <div class="flex gap-1">
        <div class="export-menu" ref="exportRef">
          <button @click="showExport=!showExport" class="btn btn-ghost">⬇ Exportar</button>
          <div v-if="showExport" class="export-dropdown">
            <button @click="doExportExcel" class="export-item">📊 Excel</button>
            <button @click="doExportWord"  class="export-item">📄 Word</button>
          </div>
        </div>
        <button @click="openRegistro" class="btn btn-primary">＋ Registrar Asistencia</button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card" style="padding:1.25rem;margin-bottom:1.25rem">
      <div class="filters-row">
        <div class="form-group">
          <label class="form-label">Área</label>
          <select v-model="filtros.area" class="form-control" @change="load">
            <option value="">Todas</option>
            <option v-for="a in areasOpts" :key="a">{{ a }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Fecha</label>
          <input v-model="filtros.fecha" type="date" class="form-control" @change="load"/>
        </div>
        <div class="form-group">
          <label class="form-label">Semana</label>
          <input v-model="filtros.semana" type="date" class="form-control" @change="load" title="Inicio de semana"/>
        </div>
        <div class="form-group">
          <label class="form-label">Mes (YYYY-MM)</label>
          <input v-model="filtros.mes" type="month" class="form-control" @change="load"/>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select v-model="filtros.estado" class="form-control" @change="load">
            <option value="">Todos</option>
            <option>Presente</option><option>Ausente</option><option>Tardanza</option><option>Permiso</option>
          </select>
        </div>
        <button @click="limpiarFiltros" class="btn btn-ghost" style="align-self:flex-end">✕</button>
      </div>
      <div class="text-sm text-muted" style="margin-top:.75rem">
        <strong>{{ asistencias.length }}</strong> registros ·
        <span style="color:var(--accent-deporte)"><strong>{{ presentes }}</strong> presentes ({{ pct }}%)</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Carnet</th><th>Nombre</th><th>Área</th><th>Becado</th><th>Estado</th><th>Notas</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-if="cargando"><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</td></tr>
            <tr v-else-if="!asistencias.length"><td colspan="8"><div class="empty-state"><div class="icon">📋</div><p>Sin registros</p></div></td></tr>
            <tr v-for="a in asistencias" :key="a.id">
              <td class="font-mono text-sm">{{ a.fecha }}</td>
              <td class="font-mono text-sm">{{ getEst(a.estudianteId)?.carnet||'—' }}</td>
              <td><strong>{{ getEst(a.estudianteId)?.nombre||'Desconocido' }}</strong></td>
              <td><span class="badge badge-cultura" style="font-size:.65rem">{{ a.area }}</span></td>
              <td>
                <span v-if="getEst(a.estudianteId)?.becado" class="badge badge-success">Becado</span>
                <span v-else class="text-muted text-sm">—</span>
              </td>
              <td><span class="badge" :class="estBadge(a.estado)">{{ a.estado }}</span></td>
              <td class="text-sm text-muted">{{ a.notas||'—' }}</td>
              <td>
                <div class="flex gap-1">
                  <button @click="editarA(a)" class="btn-icon">✏</button>
                  <button @click="confirmDel(a)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Registro Masivo -->
    <div v-if="showRegistro" class="modal-overlay" @click.self="showRegistro=false">
      <div class="modal" style="max-width:720px">
        <div class="modal-header">
          <h3 class="modal-title">Registrar Asistencia</h3>
          <button @click="showRegistro=false" class="modal-close">✕</button>
        </div>
        <div class="grid-2" style="margin-bottom:1rem">
          <div class="form-group">
            <label class="form-label">Fecha *</label>
            <input v-model="rForm.fecha" type="date" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Área *</label>
            <select v-model="rForm.area" class="form-control" @change="cargarEstudiantes">
              <option v-for="a in areasOpts" :key="a">{{ a }}</option>
            </select>
          </div>
        </div>

        <div class="flex justify-between items-center" style="margin-bottom:.5rem">
          <span class="text-sm text-muted">{{ mArea.length }} estudiantes en {{ rForm.area }}</span>
          <div class="flex gap-1">
            <button @click="marcarTodos('Presente')" class="btn btn-sm btn-success">✓ Todos Presentes</button>
            <button @click="marcarTodos('Ausente')"  class="btn btn-sm btn-danger">✗ Todos Ausentes</button>
          </div>
        </div>

        <div class="bulk-list">
          <div v-if="!mArea.length" class="empty-state"><div class="icon">👥</div><p>Sin estudiantes en esta área</p></div>
          <div v-for="(row, i) in rRows" :key="row.estudianteId" class="bulk-row">
            <div class="bulk-info">
              <span class="font-mono text-sm">{{ mArea[i]?.carnet }}</span>
              <div>
                <div style="font-size:.83rem;font-weight:500">{{ mArea[i]?.nombre }}</div>
                <div class="flex gap-1" style="margin-top:.15rem">
                  <span class="text-xs text-muted">{{ mArea[i]?.area }}</span>
                  <span v-if="mArea[i]?.becado" class="badge badge-success" style="font-size:.6rem;padding:.1rem .4rem">Becado</span>
                </div>
              </div>
            </div>
            <div class="bulk-controls">
              <button v-for="est in ['Presente','Tardanza','Permiso','Ausente']" :key="est"
                @click="row.estado=est" class="estado-btn"
                :class="[`est-${est.toLowerCase()}`, row.estado===est?'est-active':'']">
                {{ est[0] }}
              </button>
              <input v-model="row.notas" type="text" class="form-control"
                style="width:100px;font-size:.78rem;padding:.3rem .5rem" placeholder="Nota..."/>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showRegistro=false" class="btn btn-ghost">Cancelar</button>
          <button @click="guardarMasivo" class="btn btn-primary" :disabled="guardando">{{ guardando?'Guardando...':'Guardar Asistencia' }}</button>
        </div>
      </div>
    </div>

    <!-- Modal editar -->
    <div v-if="showEdit" class="modal-overlay" @click.self="showEdit=false">
      <div class="modal" style="max-width:380px">
        <div class="modal-header"><h3 class="modal-title">Editar Asistencia</h3><button @click="showEdit=false" class="modal-close">✕</button></div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select v-model="eForm.estado" class="form-control">
            <option>Presente</option><option>Ausente</option><option>Tardanza</option><option>Permiso</option>
          </select>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Notas</label>
          <input v-model="eForm.notas" type="text" class="form-control"/>
        </div>
        <div class="modal-footer">
          <button @click="showEdit=false" class="btn btn-ghost">Cancelar</button>
          <button @click="guardarEdit" class="btn btn-primary">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Confirm -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><h3 class="modal-title">Eliminar</h3><button @click="showConfirm=false" class="modal-close">✕</button></div>
        <p class="text-sm text-muted">¿Eliminar este registro?</p>
        <div class="modal-footer">
          <button @click="showConfirm=false" class="btn btn-ghost">Cancelar</button>
          <button @click="doDelete" class="btn btn-danger">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../store/auth.js'
import { getEstudiantes, getAsistencias, saveAsistencia, deleteAsistencia, registrarAsistenciaMasiva, areasDeUsuario } from '../utils/db.js'
import { exportAsistenciasExcel, exportToWord } from '../utils/export.js'

const auth  = useAuthStore()
const route = useRoute()
const areasOpts = computed(() => areasDeUsuario(auth.user))

const estudiantes = ref([])
const asistencias = ref([])
const cargando    = ref(false)
const guardando   = ref(false)

const filtros = ref({
  area:   route.query.area || '',
  fecha:  route.query.fecha || '',
  semana: '',
  mes:    '',
  estado: ''
})

const showRegistro = ref(false)
const showEdit     = ref(false)
const showExport   = ref(false)
const showConfirm  = ref(false)
const delTarget    = ref(null)
const exportRef    = ref(null)

const rForm = ref({ fecha:new Date().toISOString().split('T')[0], area:areasOpts.value[0]||'' })
const mArea = ref([])
const rRows = ref([])
const eForm = ref({ id:null, estado:'', notas:'' })

const getEst      = (id) => estudiantes.value.find(e=>e.id===id)
const estMap      = computed(() => Object.fromEntries(estudiantes.value.map(e=>[e.id,e])))
const presentes   = computed(() => asistencias.value.filter(a=>a.estado==='Presente').length)
const pct         = computed(() => asistencias.value.length ? Math.round(presentes.value/asistencias.value.length*100) : 0)

async function load() {
  cargando.value=true
  const fa={}, fe={}
  if (!auth.isAdmin && auth.userArea) { fa.grupo=auth.userArea; fe.grupo=auth.userArea }
  if (filtros.value.area)   fa.area  =filtros.value.area
  if (filtros.value.fecha)  fa.fecha =filtros.value.fecha
  if (filtros.value.semana) fa.semana=filtros.value.semana
  if (filtros.value.mes)    fa.mes   =filtros.value.mes
  ;[asistencias.value, estudiantes.value] = await Promise.all([getAsistencias(fa), getEstudiantes(fe)])
  if (filtros.value.estado) asistencias.value=asistencias.value.filter(a=>a.estado===filtros.value.estado)
  cargando.value=false
}

onMounted(async()=>{ await load(); await cargarEstudiantes(); document.addEventListener('click',handleOut) })
onUnmounted(()=>document.removeEventListener('click',handleOut))

async function limpiarFiltros() { filtros.value={area:'',fecha:'',semana:'',mes:'',estado:''}; await load() }

async function cargarEstudiantes() {
  const f={}
  if (rForm.value.area) f.area=rForm.value.area
  mArea.value = await getEstudiantes(f)
  rRows.value = mArea.value.map(e=>({estudianteId:e.id, estado:'Presente', notas:''}))
}

async function openRegistro() {
  rForm.value.fecha=new Date().toISOString().split('T')[0]
  await cargarEstudiantes()
  showRegistro.value=true
}

function marcarTodos(est) { rRows.value.forEach(r=>r.estado=est) }

async function guardarMasivo() {
  guardando.value=true
  await registrarAsistenciaMasiva(rForm.value.fecha, rForm.value.area, null, rRows.value)
  await load()
  guardando.value=false
  showRegistro.value=false
}

function editarA(a) { eForm.value={id:a.id,estado:a.estado,notas:a.notas||''}; showEdit.value=true }
async function guardarEdit() {
  const a=asistencias.value.find(x=>x.id===eForm.value.id)
  if(a) await saveAsistencia({...a,estado:eForm.value.estado,notas:eForm.value.notas})
  await load(); showEdit.value=false
}

function confirmDel(a) { delTarget.value=a; showConfirm.value=true }
async function doDelete() { await deleteAsistencia(delTarget.value.id); await load(); showConfirm.value=false }

function estBadge(est) { return {Presente:'badge-success',Ausente:'badge-danger',Tardanza:'badge-warning',Permiso:'badge-cultura'}[est]||'badge-neutral' }

function doExportExcel() { exportAsistenciasExcel(asistencias.value,estMap.value,filtros.value.area,filtros.value.fecha); showExport.value=false }
function doExportWord() {
  exportToWord(`Asistencias — ${filtros.value.area||'General'} | ${filtros.value.fecha||'Todas las fechas'}`,
    ['Fecha','Carnet','Nombre','Área','Becado','Estado','Notas'],
    asistencias.value.map(a=>{ const e=estMap.value[a.estudianteId]||{}; return [a.fecha,e.carnet||'',e.nombre||'',a.area,e.becado?'Sí':'No',a.estado,a.notas||''] }),
    `Asistencias_${filtros.value.area||'General'}`
  )
  showExport.value=false
}
function handleOut(e) { if(exportRef.value&&!exportRef.value.contains(e.target)) showExport.value=false }
</script>

<style scoped>
.filters-row{display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-end}
.bulk-list{max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:.4rem}
.bulk-row{display:flex;align-items:center;justify-content:space-between;padding:.5rem .6rem;background:var(--bg-surface);border-radius:var(--radius-sm);gap:.5rem}
.bulk-info{display:flex;align-items:center;gap:.65rem;min-width:200px}
.bulk-controls{display:flex;align-items:center;gap:.35rem}
.estado-btn{width:28px;height:28px;border-radius:4px;border:1px solid var(--border);background:var(--bg-card);color:var(--text-muted);font-size:.72rem;font-weight:700;cursor:pointer;transition:var(--transition)}
.est-presente.est-active{background:rgba(62,207,142,.2);border-color:var(--accent-deporte);color:var(--accent-deporte)}
.est-tardanza.est-active{background:rgba(245,158,11,.2);border-color:var(--accent-admin);color:var(--accent-admin)}
.est-permiso.est-active{background:rgba(124,106,247,.2);border-color:var(--accent-cultura);color:var(--accent-cultura)}
.est-ausente.est-active{background:rgba(232,93,117,.2);border-color:var(--accent-arte);color:var(--accent-arte)}
.export-menu{position:relative}
.export-dropdown{position:absolute;top:calc(100%+6px);right:0;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;z-index:100;min-width:160px;box-shadow:var(--shadow-md)}
.export-item{display:block;width:100%;text-align:left;padding:.65rem 1rem;background:none;border:none;color:var(--text-primary);font-size:.85rem;cursor:pointer;transition:var(--transition)}
.export-item:hover{background:var(--bg-hover)}
</style>