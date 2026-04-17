<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Permisos</h1><p class="page-subtitle">Permisos institucionales para actividades</p></div>
      <div class="flex gap-1">
        <div class="export-menu" ref="exportRef">
          <button @click="showExport=!showExport" class="btn btn-ghost">⬇ Exportar</button>
          <div v-if="showExport" class="export-dropdown">
            <button @click="abrirModalExport('word')"  class="export-item">📄 Word</button>
            <button @click="abrirModalExport('pdf')"   class="export-item">📕 PDF</button>
          </div>
        </div>
        <button @click="openModal()" class="btn btn-primary">＋ Nuevo Permiso</button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card" style="padding:1.25rem;margin-bottom:1.25rem">
      <div class="flex gap-2" style="flex-wrap:wrap;align-items:flex-end">
        <div class="form-group">
          <label class="form-label">Área</label>
          <select v-model="filtros.area" class="form-control" @change="load">
            <option value="">Todas</option>
            <option v-for="a in areasOpts" :key="a">{{ a }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Estado</label>
          <select v-model="filtros.estado" class="form-control" @change="load">
            <option value="">Todos</option>
            <option>Pendiente</option><option>Aprobado</option><option>Rechazado</option>
          </select>
        </div>
        <button @click="limpiar" class="btn btn-ghost" style="align-self:flex-end">✕</button>
      </div>
      <div class="text-sm text-muted" style="margin-top:.75rem">
        <strong>{{ permisos.length }}</strong> permisos ·
        <span style="color:var(--accent-admin)"><strong>{{ pendientes }}</strong> pendientes</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Solicitante</th><th>Área</th><th>Tipo</th><th>Actividad</th>
              <th>Fecha Inicio</th><th>Fecha Fin</th><th>Motivo</th>
              <th>Estado</th><th>Aprobado Por</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando">
              <td colspan="10" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</td>
            </tr>
            <tr v-else-if="!permisos.length">
              <td colspan="10"><div class="empty-state"><div class="icon">📋</div><p>Sin permisos</p></div></td>
            </tr>
            <tr v-for="p in permisos" :key="p.id">
              <td><strong>{{ p.solicitante }}</strong></td>
              <td><span class="badge badge-cultura" style="font-size:.65rem">{{ p.area }}</span></td>
              <td class="text-sm">{{ p.tipo }}</td>
              <td class="text-sm">{{ p.actividad||'—' }}</td>
              <td class="font-mono text-sm">{{ p.fechaInicio }}</td>
              <td class="font-mono text-sm">{{ p.fechaFin }}</td>
              <td class="text-sm">{{ p.motivo }}</td>
              <td><span class="badge" :class="estColor(p.estado)">{{ p.estado }}</span></td>
              <td class="text-sm text-muted">{{ p.aprobadoPor||'—' }}</td>
              <td>
                <div class="flex gap-1">
                  <button v-if="p.estado==='Pendiente'" @click="aprobar(p)"  class="btn btn-sm btn-success">✓</button>
                  <button v-if="p.estado==='Pendiente'" @click="rechazar(p)" class="btn btn-sm btn-danger">✗</button>
                  <button @click="openModal(p)"  class="btn-icon">✏</button>
                  <button @click="confirmDel(p)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">

      <!-- ── Modal Nuevo/Editar Permiso ── -->
      <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title">{{ editing?'Editar':'Nuevo' }} Permiso</h3>
            <button @click="showModal=false" class="modal-close">✕</button>
          </div>
          <div class="grid-2">
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Solicitante *</label>
              <input v-model="form.solicitante" type="text" class="form-control" placeholder="Nombre del estudiante"/>
            </div>
            <div class="form-group">
              <label class="form-label">Área</label>
              <select v-model="form.area" class="form-control">
                <option v-for="a in areasOpts" :key="a">{{ a }}</option>
              </select>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Actividad / Descripción</label>
              <input v-model="form.actividad" type="text" class="form-control" placeholder="Festival, torneo, viaje..."/>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Inicio *</label>
              <input v-model="form.fechaInicio" type="date" class="form-control"/>
            </div>
            <div class="form-group">
              <label class="form-label">Fecha Fin *</label>
              <input v-model="form.fechaFin" type="date" class="form-control"/>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">Motivo *</label>
              <input v-model="form.motivo" type="text" class="form-control"
                placeholder="Ej: el cantante solista, quien fue solicitado para una presentación el día 23 de marzo"/>
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select v-model="form.estado" class="form-control">
                <option>Pendiente</option><option>Aprobado</option><option>Rechazado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Aprobado Por</label>
              <input v-model="form.aprobadoPor" type="text" class="form-control"/>
            </div>
          </div>
          <div class="form-group" style="margin-top:.75rem">
            <label class="form-label">Notas</label>
            <textarea v-model="form.notas" class="form-control" rows="2"></textarea>
          </div>
          <div v-if="formError" class="alert alert-error" style="margin-top:.5rem">{{ formError }}</div>
          <div class="modal-footer">
            <button @click="showModal=false" class="btn btn-ghost">Cancelar</button>
            <button @click="save" class="btn btn-primary" :disabled="guardando">
              {{ guardando?'Guardando...':(editing?'Guardar':'Registrar') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ── Modal Eliminar ── -->
      <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
        <div class="modal" style="max-width:340px">
          <div class="modal-header">
            <h3 class="modal-title">Eliminar</h3>
            <button @click="showConfirm=false" class="modal-close">✕</button>
          </div>
          <p class="text-sm text-muted">¿Eliminar este permiso?</p>
          <div class="modal-footer">
            <button @click="showConfirm=false" class="btn btn-ghost">Cancelar</button>
            <button @click="doDelete" class="btn btn-danger">Eliminar</button>
          </div>
        </div>
      </div>

      <!-- ── Modal Exportar Carta (Word / PDF) ── -->
      <div v-if="showModalExport" class="modal-overlay" @click.self="showModalExport=false">
        <div class="modal" style="max-width:480px">
          <div class="modal-header">
            <h3 class="modal-title">
              {{ tipoExport === 'word' ? '📄 Exportar Word' : '📕 Exportar PDF' }}
            </h3>
            <button @click="showModalExport=false" class="modal-close">✕</button>
          </div>

          <div class="form-group">
            <label class="form-label">Seleccionar permiso *</label>
            <select v-model="exportPermisoId" class="form-control">
              <option value="">— Elige un permiso —</option>
              <option v-for="p in permisos" :key="p.id" :value="p.id">
                {{ p.solicitante }} — {{ p.actividad || p.motivo }} ({{ p.fechaInicio }})
              </option>
            </select>
          </div>

          <div class="form-group" style="margin-top:.75rem">
            <label class="form-label">Nombre del docente *</label>
            <input
              v-model="exportDocente"
              type="text"
              class="form-control"
              placeholder="Ej: Ing. María López, Dr. Juan Pérez..."
            />
            <span class="text-sm text-muted" style="display:block;margin-top:.3rem">
              Escribe el título y nombre exactamente como debe aparecer (Lic., Ing., Dr., etc.)
            </span>
          </div>

          <div class="form-group" style="margin-top:.75rem">
            <label class="form-label">Materia del docente *</label>
            <input
              v-model="exportMateria"
              type="text"
              class="form-control"
              placeholder="Ej: Constitucional I, Matemática II..."
            />
            <span class="text-sm text-muted" style="display:block;margin-top:.3rem">
              Aparecerá como "Docente de: [materia]" en la carta
            </span>
          </div>


          <div v-if="exportError" class="alert alert-error" style="margin-top:.5rem">{{ exportError }}</div>

          <div class="modal-footer">
            <button @click="showModalExport=false" class="btn btn-ghost">Cancelar</button>
            <button @click="confirmarExport" class="btn btn-primary">
              {{ tipoExport === 'word' ? '📄 Descargar Word' : '📕 Descargar PDF' }}
            </button>
          </div>
        </div>
      </div>

    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../store/auth.js'
import { getPermisos, savePermiso, deletePermiso, areasDeUsuario } from '../utils/db.js'
import { exportPermisosExcel, exportPermisoWord, exportPermisoPDF } from '../utils/export.js'

const auth = useAuthStore()
const areasOpts = computed(() => areasDeUsuario(auth.user))

const permisos    = ref([])
const cargando    = ref(false)
const guardando   = ref(false)
const filtros     = ref({ area:'', estado:'' })
const showModal   = ref(false)
const showExport  = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const delTarget   = ref(null)
const formError   = ref('')
const exportRef   = ref(null)

// ── Estado modal exportar carta ────────────────────────────────────────────
const showModalExport = ref(false)
const tipoExport      = ref('')       // 'word' | 'pdf'
const exportPermisoId = ref('')
const exportDocente   = ref('')
const exportMateria   = ref('')
const exportError     = ref('')

const pendientes = computed(() => permisos.value.filter(p => p.estado === 'Pendiente').length)

const defForm = () => ({
  solicitante:'', area:areasOpts.value[0]||'', tipo:'Permiso de Presentación',
  actividad:'', fechaInicio:new Date().toISOString().split('T')[0],
  fechaFin:new Date().toISOString().split('T')[0],
  motivo:'', estado:'Pendiente', aprobadoPor:'', notas:''
})
const form = ref(defForm())

async function load() {
  cargando.value = true
  const f = {}
  if (!auth.isAdmin && auth.userArea) f.grupo = auth.userArea
  if (filtros.value.area)   f.area   = filtros.value.area
  if (filtros.value.estado) f.estado = filtros.value.estado
  permisos.value = await getPermisos(f)
  cargando.value = false
}

async function limpiar() { filtros.value = { area:'', estado:'' }; await load() }

onMounted(async () => { await load(); document.addEventListener('click', handleOut) })
onUnmounted(() => document.removeEventListener('click', handleOut))

function openModal(p = null) {
  formError.value = ''; editing.value = !!p
  form.value = p ? { ...p } : defForm()
  showModal.value = true
}

async function save() {
  if (!form.value.solicitante.trim()) { formError.value = 'Solicitante requerido'; return }
  if (!form.value.motivo.trim())      { formError.value = 'Motivo requerido';      return }
  guardando.value = true
  await savePermiso(form.value)
  await load()
  guardando.value = false
  showModal.value = false
}

async function aprobar(p)  { await savePermiso({...p, estado:'Aprobado',  aprobadoPor: auth.userName||'Admin'}); await load() }
async function rechazar(p) { await savePermiso({...p, estado:'Rechazado', aprobadoPor: auth.userName||'Admin'}); await load() }
function confirmDel(p) { delTarget.value = p; showConfirm.value = true }
async function doDelete() { await deletePermiso(delTarget.value.id); await load(); showConfirm.value = false }
function estColor(e) { return { Pendiente:'badge-warning', Aprobado:'badge-success', Rechazado:'badge-danger' }[e] || 'badge-neutral' }

// ── Exportar ───────────────────────────────────────────────────────────────
function abrirModalExport(tipo) {
  showExport.value = false

  if (tipo === 'excel') {
    exportPermisosExcel(permisos.value, {})
    return
  }

  // Word o PDF → abrir modal para elegir permiso y docente
  tipoExport.value      = tipo
  exportPermisoId.value = permisos.value.length === 1 ? permisos.value[0].id : ''
  exportDocente.value   = ''
  exportMateria.value   = ''
  exportError.value     = ''
  showModalExport.value = true
}

function confirmarExport() {
  exportError.value = ''

  if (!exportPermisoId.value)   { exportError.value = 'Debes seleccionar un permiso'; return }
  if (!exportDocente.value.trim()) { exportError.value = 'Debes escribir el nombre del docente'; return }
  if (!exportMateria.value.trim()) { exportError.value = 'Debes escribir la materia del docente'; return }

  const permiso = permisos.value.find(p => p.id === exportPermisoId.value)
  if (!permiso) return

  // Adjuntar el nombre del docente al objeto antes de exportar
  const datos = { ...permiso, docente: exportDocente.value.trim(), materia: exportMateria.value.trim() }

  if (tipoExport.value === 'word') exportPermisoWord(datos)
  else                              exportPermisoPDF(datos)

  showModalExport.value = false
}

function handleOut(e) {
  if (exportRef.value && !exportRef.value.contains(e.target)) showExport.value = false
}
</script>

<style scoped>
.export-menu { position: relative }
.export-dropdown {
  position: absolute; top: calc(100% + 6px); right: 0;
  background: var(--bg-card); border: 1px solid var(--border-light);
  border-radius: var(--radius-md); overflow: hidden; z-index: 100;
  min-width: 160px; box-shadow: var(--shadow-md)
}
.export-item {
  display: block; width: 100%; text-align: left;
  padding: .65rem 1rem; background: none; border: none;
  color: var(--text-primary); font-size: .85rem;
  cursor: pointer; transition: var(--transition)
}
.export-item:hover { background: var(--bg-hover) }
</style>