<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Actividades</h1><p class="page-subtitle">Ensayos, prácticas, talleres y reuniones</p></div>
      <button @click="openModal()" class="btn btn-primary">＋ Nueva Actividad</button>
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
          <label class="form-label">Tipo</label>
          <select v-model="filtros.tipo" class="form-control" @change="load">
            <option value="">Todos</option>
            <option>Ensayo</option>
            <option>Práctica Deportiva</option>
            <option>Taller</option>
            <option>Reunión</option>
            <option>Evento Cultural</option>
          </select>
        </div>
        <button @click="limpiar" class="btn btn-ghost" style="align-self:flex-end">✕</button>
      </div>
    </div>

    <!-- Lista de actividades -->
    <div class="act-grid">
      <div v-if="cargando" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</div>
      <div v-else-if="!actividades.length" style="grid-column:1/-1">
        <div class="empty-state card"><div class="icon">📅</div><p>Sin actividades registradas</p></div>
      </div>
      <div v-for="a in actividades" :key="a.id" class="act-card">
        <div class="act-header">
          <span class="badge" :class="tipoBadge(a.tipo)">{{ a.tipo }}</span>
          <span class="font-mono text-sm text-muted">{{ a.fecha }}</span>
        </div>
        <div class="act-titulo">{{ a.titulo }}</div>
        <div class="act-area text-sm text-muted">{{ a.area }}</div>
        <div v-if="a.tipo==='Práctica Deportiva'" class="act-extra text-sm">
          <span class="badge badge-neutral">{{ a.tipoPartido||'—' }}</span>
        </div>
        <div v-if="a.comentarios" class="act-comentario text-sm text-muted">{{ a.comentarios }}</div>
        <div class="act-footer">
          <span class="text-xs text-muted">{{ a.participantes?.length||0 }} participantes</span>
          <div class="flex gap-1">
            <button @click="verAsistencia(a)" class="btn btn-ghost btn-sm">📋 Asistencia</button>
            <button @click="openModal(a)" class="btn-icon">✏</button>
            <button @click="confirmDel(a)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal form -->
     <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal" style="max-width:600px">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing?'Editar':'Nueva' }} Actividad</h3>
          <button @click="showModal=false" class="modal-close">✕</button>
        </div>
        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Título *</label>
            <input v-model="form.titulo" type="text" class="form-control" placeholder="Ensayo general, Práctica fútbol..."/>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo *</label>
            <select v-model="form.tipo" class="form-control">
              <option>Ensayo</option>
              <option>Taller</option>
              <option>Reunión</option>
              <option>Evento Cultural</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Área *</label>
            <select v-model="form.area" class="form-control">
              <option v-for="a in areasOpts" :key="a">{{ a }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha</label>
            <input v-model="form.fecha" type="date" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input v-model="form.hora" type="time" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Lugar</label>
            <input v-model="form.lugar" type="text" class="form-control" placeholder="Cancha, sala, auditorio..."/>
          </div>
          <!-- Tipo de ensayo si es Arte/Danza -->

          <!-- Tipo partido si es Práctica Deportiva -->
          <div class="form-group" v-if="form.tipo==='Práctica Deportiva'">
            <label class="form-label">Tipo de partido</label>
            <select v-model="form.tipoPartido" class="form-control">
              <option value="">— Seleccionar —</option>
              <option>Partido Amistoso</option>
              <option>Partido Oficial</option>
              <option>Práctica Interna</option>
              <option>Otro</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Comentarios</label>
          <textarea v-model="form.comentarios" class="form-control" rows="2" placeholder="Observaciones adicionales..."></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showModal=false" class="btn btn-ghost">Cancelar</button>
          <button @click="save" class="btn btn-primary" :disabled="guardando">{{ guardando?'Guardando...':'Registrar' }}</button>
        </div>
      </div>
    </div>
    </Teleport>

    <!-- Confirm -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><h3 class="modal-title">Eliminar</h3><button @click="showConfirm=false" class="modal-close">✕</button></div>
        <p class="text-sm text-muted">¿Eliminar <strong>{{ delTarget?.titulo }}</strong>?</p>
        <div class="modal-footer">
          <button @click="showConfirm=false" class="btn btn-ghost">Cancelar</button>
          <button @click="doDelete" class="btn btn-danger">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/auth.js'
import { getActividades, saveActividad, deleteActividad, areasDeUsuario } from '../utils/db.js'

const auth   = useAuthStore()
const router = useRouter()
const areasOpts = computed(() => areasDeUsuario(auth.user))

const actividades = ref([])
const cargando    = ref(false)
const guardando   = ref(false)
const filtros     = ref({ area:'', tipo:'' })
const showModal   = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const delTarget   = ref(null)

const defForm = () => ({
  titulo:'', tipo:'Ensayo', area:areasOpts.value[0]||'',
  fecha:new Date().toISOString().split('T')[0], hora:'',
  lugar:'', subarea:'', tipoPartido:'', comentarios:''
})
const form = ref(defForm())

async function load() {
  cargando.value=true
  const f={}
  if (!auth.isAdmin && auth.userArea) f.grupo=auth.userArea
  if (filtros.value.area) f.area=filtros.value.area
  if (filtros.value.tipo) f.tipo=filtros.value.tipo
  actividades.value = await getActividades(f)
  cargando.value=false
}
async function limpiar() { filtros.value={area:'',tipo:''}; await load() }
onMounted(async()=>{ await load() })

function openModal(a=null) {
  editing.value=!!a
  form.value=a?{...a}:defForm()
  showModal.value=true
}

async function save() {
  if (!form.value.titulo.trim()) return
  guardando.value=true
  await saveActividad(form.value)
  await load()
  guardando.value=false
  showModal.value=false
}

function verAsistencia(a) {
  router.push(`/asistencias?actividadId=${a.id}&area=${a.area}&fecha=${a.fecha}`)
}

function confirmDel(a) { delTarget.value=a; showConfirm.value=true }
async function doDelete() { await deleteActividad(delTarget.value.id); await load(); showConfirm.value=false }

function tipoBadge(t) {
  return {
    'Ensayo':'badge-cultura',
    'Práctica Deportiva':'badge-deporte',
    'Taller':'badge-warning',
    'Reunión':'badge-neutral',
    'Evento Cultural':'badge-arte'
  }[t]||'badge-neutral'
}
</script>

<style scoped>
.act-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
.act-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;display:flex;flex-direction:column;gap:.5rem;transition:var(--transition)}
.act-card:hover{border-color:var(--border-light);transform:translateY(-2px)}
.act-header{display:flex;justify-content:space-between;align-items:center}
.act-titulo{font-weight:600;font-size:.95rem}
.act-area{font-size:.8rem}
.act-footer{display:flex;justify-content:space-between;align-items:center;margin-top:.5rem;padding-top:.5rem;border-top:1px solid var(--border)}
</style>