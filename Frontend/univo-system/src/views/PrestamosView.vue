<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Préstamos</h1><p class="page-subtitle">Control de recursos prestados a estudiantes</p></div>
      <div class="flex gap-1">
        <div class="export-menu" ref="exportRef">
          <button @click="showExport=!showExport" class="btn btn-ghost">⬇ Exportar</button>
          <div v-if="showExport" class="export-dropdown">
            <button @click="doExportExcel" class="export-item">📊 Excel</button>
            <button @click="doExportWord"  class="export-item">📄 Word</button>
          </div>
        </div>
        <button @click="openModal()" class="btn btn-primary">＋ Nuevo Préstamo</button>
      </div>
    </div>

    <div class="card" style="padding:1.25rem;margin-bottom:1.25rem">
      <div class="flex gap-2" style="flex-wrap:wrap;align-items:flex-end">
        <div class="form-group" style="flex:2">
          <label class="form-label">Buscar</label>
          <input v-model="search" type="text" class="form-control" placeholder="Nombre o carnet..." @input="load"/>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select v-model="filtroEnt" class="form-control" @change="load">
            <option value="">Todos</option><option value="false">Activos</option><option value="true">Devueltos</option>
          </select>
        </div>
      </div>
      <div class="text-sm text-muted" style="margin-top:.75rem">
        <strong>{{ prestamos.length }}</strong> préstamos ·
        <span style="color:var(--accent-admin)"><strong>{{ activos }}</strong> activos</span>
      </div>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Recurso</th><th>Estudiante</th><th>Carnet</th><th>Carrera</th>
              <th>F.Préstamo</th><th>F.Devolución</th><th>Est.Salida</th><th>Est.Regreso</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando"><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</td></tr>
            <tr v-else-if="!prestamos.length"><td colspan="10"><div class="empty-state"><div class="icon">📦</div><p>Sin préstamos</p></div></td></tr>
            <tr v-for="p in prestamos" :key="p.id" :class="{'row-activo':!p.entregado}">
              <td>
                <div>
                  <strong>{{ getRecurso(p.recursoId)?.nombre||p.recursoNombre||'—' }}</strong>
                  <div class="text-xs text-muted font-mono">{{ getRecurso(p.recursoId)?.codigo||'' }}</div>
                </div>
              </td>
              <td><strong>{{ p.estudianteNombre }}</strong></td>
              <td class="font-mono text-sm">{{ p.estudianteCarnet }}</td>
              <td class="text-sm">{{ p.estudianteCarrera||'—' }}</td>
              <td class="font-mono text-sm">{{ p.fechaPrestamo }}</td>
              <td class="font-mono text-sm">{{ p.fechaDevolucion||'—' }}</td>
              <td><span class="badge" :class="estColor(p.estadoSalida)">{{ p.estadoSalida }}</span></td>
              <td>
                <span v-if="p.estadoDevolucion" class="badge" :class="estColor(p.estadoDevolucion)">{{ p.estadoDevolucion }}</span>
                <span v-else class="text-muted text-sm">—</span>
              </td>
              <td><span class="badge" :class="p.entregado?'badge-success':'badge-warning'">{{ p.entregado?'Devuelto':'Activo' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <button v-if="!p.entregado" @click="abrirDevolucion(p)" class="btn btn-sm btn-success">↩</button>
                  <button @click="openModal(p)"  class="btn-icon">✏</button>
                  <button @click="confirmDel(p)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal form -->
     <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing?'Editar':'Nuevo' }} Préstamo</h3>
          <button @click="showModal=false" class="modal-close">✕</button>
        </div>
        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Recurso *</label>
            <select v-model="form.recursoId" class="form-control" @change="onRecursoChange">
              <option value="">— Seleccionar recurso —</option>
              <option v-for="r in recursos" :key="r.id" :value="r.id">{{ r.codigo }} — {{ r.nombre }} ({{ r.area }})</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre del estudiante *</label>
            <input v-model="form.estudianteNombre" type="text" class="form-control" placeholder="Nombre completo"/>
          </div>
          <div class="form-group">
            <label class="form-label">Carnet *</label>
            <input v-model="form.estudianteCarnet" type="text" class="form-control" placeholder="00000"/>
          </div>
          <div class="form-group">
            <label class="form-label">Carrera</label>
            <input v-model="form.estudianteCarrera" type="text" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" type="text" class="form-control" placeholder="7000-0000"/>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha Préstamo</label>
            <input v-model="form.fechaPrestamo" type="date" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Estado al Salir</label>
            <select v-model="form.estadoSalida" class="form-control">
              <option>Bueno</option><option>Regular</option><option>Malo</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Notas</label>
          <textarea v-model="form.notas" class="form-control" rows="2"></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showModal=false" class="btn btn-ghost">Cancelar</button>
          <button @click="save" class="btn btn-primary" :disabled="guardando">{{ guardando?'Guardando...':'Registrar' }}</button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Modal devolución -->
    <div v-if="showDev" class="modal-overlay" @click.self="showDev=false">
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h3 class="modal-title">Registrar Devolución</h3>
          <button @click="showDev=false" class="modal-close">✕</button>
        </div>
        <p class="text-sm text-muted" style="margin-bottom:1rem">
          Recurso: <strong>{{ getRecurso(devForm.recursoId)?.nombre||'—' }}</strong> ·
          Estudiante: <strong>{{ devForm.estudianteNombre }}</strong>
        </p>
        <div class="form-group">
          <label class="form-label">Fecha Devolución</label>
          <input v-model="devForm.fechaDevolucion" type="date" class="form-control"/>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Estado al Regresar *</label>
          <select v-model="devForm.estadoDevolucion" class="form-control">
            <option>Bueno</option><option>Regular</option><option>Malo</option>
          </select>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Notas</label>
          <input v-model="devForm.notas" type="text" class="form-control"/>
        </div>
        <div class="modal-footer">
          <button @click="showDev=false" class="btn btn-ghost">Cancelar</button>
          <button @click="confirmarDev" class="btn btn-success">Confirmar Devolución</button>
        </div>
      </div>
    </div>

    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><h3 class="modal-title">Eliminar</h3><button @click="showConfirm=false" class="modal-close">✕</button></div>
        <p class="text-sm text-muted">¿Eliminar este préstamo?</p>
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
import { useAuthStore } from '../store/auth.js'
import { getPrestamos, savePrestamo, deletePrestamo, getRecursos, areasDeUsuario } from '../utils/db.js'
import { exportPrestamosExcel, exportToWord } from '../utils/export.js'

const auth = useAuthStore()
const prestamos  = ref([])
const recursos   = ref([])
const cargando   = ref(false)
const guardando  = ref(false)
const search     = ref('')
const filtroEnt  = ref('')
const showModal  = ref(false)
const showDev    = ref(false)
const showExport = ref(false)
const showConfirm= ref(false)
const editing    = ref(false)
const delTarget  = ref(null)
const exportRef  = ref(null)

const defForm = () => ({
  recursoId:'', recursoNombre:'', estudianteNombre:'', estudianteCarnet:'',
  estudianteCarrera:'', telefono:'',
  fechaPrestamo:new Date().toISOString().split('T')[0],
  estadoSalida:'Bueno', estadoDevolucion:null, fechaDevolucion:null, entregado:false, notas:''
})
const form    = ref(defForm())
const devForm = ref({ id:null, recursoId:null, estudianteNombre:'', fechaDevolucion:new Date().toISOString().split('T')[0], estadoDevolucion:'Bueno', notas:'' })

const recMap  = computed(() => Object.fromEntries(recursos.value.map(r=>[r.id,r])))
const activos = computed(() => prestamos.value.filter(p=>!p.entregado).length)

async function load() {
  cargando.value=true
  const fp={}, fr={}
  if (filtroEnt.value!=='') fp.entregado=filtroEnt.value
  if (search.value) fp.search=search.value
  if (!auth.isAdmin && auth.userArea) fr.grupo=auth.userArea
  ;[prestamos.value, recursos.value] = await Promise.all([getPrestamos(fp), getRecursos(fr)])
  cargando.value=false
}

onMounted(async()=>{ await load(); document.addEventListener('click',handleOut) })
onUnmounted(()=>document.removeEventListener('click',handleOut))

function getRecurso(id) { return recMap.value[id] }

function onRecursoChange() {
  const r=getRecurso(form.value.recursoId)
  if (r) form.value.recursoNombre=r.nombre
}

function openModal(p=null) { editing.value=!!p; form.value=p?{...p}:defForm(); showModal.value=true }

async function save() {
  if (!form.value.recursoId||!form.value.estudianteNombre||!form.value.estudianteCarnet) return
  guardando.value=true
  await savePrestamo(form.value)
  await load()
  guardando.value=false
  showModal.value=false
}

function abrirDevolucion(p) {
  devForm.value={ id:p.id, recursoId:p.recursoId, estudianteNombre:p.estudianteNombre, fechaDevolucion:new Date().toISOString().split('T')[0], estadoDevolucion:'Bueno', notas:'' }
  showDev.value=true
}

async function confirmarDev() {
  const p=prestamos.value.find(x=>x.id===devForm.value.id)
  if (p) await savePrestamo({...p, entregado:true, fechaDevolucion:devForm.value.fechaDevolucion, estadoDevolucion:devForm.value.estadoDevolucion, notas:devForm.value.notas})
  await load(); showDev.value=false
}

function confirmDel(p) { delTarget.value=p; showConfirm.value=true }
async function doDelete() { await deletePrestamo(delTarget.value.id); await load(); showConfirm.value=false }

function estColor(e) { return {Bueno:'badge-success',Regular:'badge-warning',Malo:'badge-danger'}[e]||'badge-neutral' }

function doExportExcel() { exportPrestamosExcel(prestamos.value,recMap.value); showExport.value=false }
function doExportWord() {
  exportToWord('Registro de Préstamos',
    ['Recurso','Estudiante','Carnet','Carrera','F.Préstamo','F.Devolución','Est.Salida','Est.Regreso','Entregado'],
    prestamos.value.map(p=>{ const r=recMap.value[p.recursoId]||{}; return [r.nombre||'',p.estudianteNombre,p.estudianteCarnet,p.estudianteCarrera||'',p.fechaPrestamo,p.fechaDevolucion||'Pendiente',p.estadoSalida,p.estadoDevolucion||'',p.entregado?'Sí':'No'] }),
    `Prestamos_${new Date().toISOString().split('T')[0]}`
  )
  showExport.value=false
}
function handleOut(e) { if(exportRef.value&&!exportRef.value.contains(e.target)) showExport.value=false }
</script>

<style scoped>
.row-activo{border-left:3px solid var(--accent-admin)}
.export-menu{position:relative}
.export-dropdown{position:absolute;top:calc(100%+6px);right:0;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;z-index:100;min-width:160px;box-shadow:var(--shadow-md)}
.export-item{display:block;width:100%;text-align:left;padding:.65rem 1rem;background:none;border:none;color:var(--text-primary);font-size:.85rem;cursor:pointer;transition:var(--transition)}
.export-item:hover{background:var(--bg-hover)}
</style>