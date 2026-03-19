<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Inventario</h1><p class="page-subtitle">Recursos, instrumentos y utilería</p></div>
      <button @click="openModal()" class="btn btn-primary">＋ Nuevo Recurso</button>
    </div>

    <div class="card" style="padding:1.25rem;margin-bottom:1.25rem">
      <div class="flex gap-2" style="flex-wrap:wrap;align-items:flex-end">
        <div class="form-group" style="flex:2"><label class="form-label">Buscar</label><input v-model="filtros.search" type="text" class="form-control" placeholder="Nombre, código..." @input="load"/></div>
        <div class="form-group"><label class="form-label">Área</label>
          <select v-model="filtros.area" class="form-control" @change="load">
            <option value="">Todas</option>
            <option v-for="a in areasOpts" :key="a">{{ a }}</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Tipo</label>
          <select v-model="filtros.tipo" class="form-control" @change="load">
            <option value="">Todos</option><option>Musical</option><option>Vestuario</option><option>Deportivo</option><option>Arte</option><option>Otro</option>
          </select>
        </div>
        <button @click="limpiar" class="btn btn-ghost" style="align-self:flex-end">✕</button>
      </div>
    </div>

    <div class="inst-grid">
      <div v-if="cargando" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</div>
      <div v-else-if="!recursos.length" style="grid-column:1/-1"><div class="empty-state card"><div class="icon">🎸</div><p>Sin recursos registrados</p></div></div>
      <div v-for="r in recursos" :key="r.id" class="inst-card">
        <div class="inst-img" v-if="r.fotos?.length">
          <img :src="urlArchivo(r.fotos[0])" alt="recurso"/>
        </div>
        <div class="inst-header">
          <div style="font-size:1.5rem">{{ tipoIcon(r.tipo) }}</div>
          <div style="display:flex;flex-direction:column;gap:.3rem;align-items:flex-end">
            <span class="badge badge-cultura" style="font-size:.65rem">{{ r.area }}</span>
            <span class="badge" :class="estColor(r.estado)">{{ r.estado }}</span>
          </div>
        </div>
        <div style="font-weight:600;font-size:.9rem">{{ r.nombre }}</div>
        <div class="font-mono text-sm text-muted">{{ r.codigo }}</div>
        <div v-if="r.descripcion" class="text-sm text-muted">{{ r.descripcion }}</div>
        <div v-if="r.fotos?.length" class="text-xs text-muted">{{ r.fotos.length }} foto(s)</div>
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <button @click="openModal(r)" class="btn btn-ghost btn-sm">✏ Editar</button>
          <button @click="confirmDel(r)" class="btn btn-sm" style="background:rgba(232,93,117,.1);color:var(--accent-arte);border:1px solid rgba(232,93,117,.2)">✕</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal">
        <div class="modal-header"><h3 class="modal-title">{{ editing?'Editar':'Nuevo' }} Recurso</h3><button @click="showModal=false" class="modal-close">✕</button></div>
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Código *</label><input v-model="form.codigo" type="text" class="form-control" placeholder="GUI-001"/></div>
          <div class="form-group"><label class="form-label">Nombre *</label><input v-model="form.nombre" type="text" class="form-control"/></div>
          <div class="form-group"><label class="form-label">Área</label>
            <select v-model="form.area" class="form-control"><option v-for="a in areasOpts" :key="a">{{ a }}</option></select>
          </div>
          <div class="form-group"><label class="form-label">Tipo</label>
            <select v-model="form.tipo" class="form-control"><option>Musical</option><option>Vestuario</option><option>Deportivo</option><option>Arte</option><option>Otro</option></select>
          </div>
          <div class="form-group"><label class="form-label">Estado</label>
            <select v-model="form.estado" class="form-control"><option>Bueno</option><option>Regular</option><option>Malo</option></select>
          </div>
          <div class="form-group"><label class="form-label">Cantidad</label><input v-model="form.cantidad" type="number" min="1" class="form-control"/></div>
        </div>
        <div class="form-group" style="margin-top:.75rem"><label class="form-label">Descripción</label><textarea v-model="form.descripcion" class="form-control" rows="2"></textarea></div>

        <!-- Fotos -->
        <div class="form-group" style="margin-top:.75rem">
          <label class="form-label">Fotos del recurso</label>
          <div class="upload-zone" @click="$refs.fotoInput.click()">
            <input ref="fotoInput" type="file" accept="image/*" multiple style="display:none" @change="handleFotos"/>
            <div class="text-sm text-muted">Haz clic para subir fotos</div>
          </div>
          <div v-if="form.fotos?.length" class="img-preview-grid">
            <div v-for="(f,i) in form.fotos" :key="i" class="img-preview">
              <img :src="urlArchivo(f)" alt="recurso"/>
              <button @click="form.fotos.splice(i,1)" class="img-remove">✕</button>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal=false" class="btn btn-ghost">Cancelar</button>
          <button @click="save" class="btn btn-primary" :disabled="guardando">{{ guardando?'Guardando...':(editing?'Guardar':'Registrar') }}</button>
        </div>
      </div>
    </div>

    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><h3 class="modal-title">Eliminar</h3><button @click="showConfirm=false" class="modal-close">✕</button></div>
        <p class="text-sm text-muted">¿Eliminar <strong>{{ delTarget?.nombre }}</strong>?</p>
        <div class="modal-footer"><button @click="showConfirm=false" class="btn btn-ghost">Cancelar</button><button @click="doDelete" class="btn btn-danger">Eliminar</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth.js'
import { getRecursos, saveRecurso, deleteRecurso, uploadArchivos, urlArchivo, areasDeUsuario } from '../utils/db.js'

const auth = useAuthStore()
const areasOpts = computed(() => areasDeUsuario(auth.user))

const recursos   = ref([])
const cargando   = ref(false)
const guardando  = ref(false)
const filtros    = ref({ search:'', area:'', tipo:'' })
const showModal  = ref(false)
const showConfirm= ref(false)
const editing    = ref(false)
const delTarget  = ref(null)
const fotoInput  = ref(null)

const defForm = () => ({ codigo:'', nombre:'', area:areasOpts.value[0]||'', tipo:'Musical', estado:'Bueno', descripcion:'', cantidad:1, fotos:[], activo:true })
const form = ref(defForm())

async function load() {
  cargando.value=true
  const f={}
  if (!auth.isAdmin && auth.userArea) f.grupo=auth.userArea
  if (filtros.value.area)   f.area  =filtros.value.area
  if (filtros.value.tipo)   f.tipo  =filtros.value.tipo
  if (filtros.value.search) f.search=filtros.value.search
  recursos.value = await getRecursos(f)
  cargando.value=false
}
async function limpiar() { filtros.value={search:'',area:'',tipo:''}; await load() }
onMounted(async()=>{ await load() })

function openModal(r=null) { editing.value=!!r; form.value=r?{...r,fotos:[...(r.fotos||[])]}:defForm(); showModal.value=true }

async function handleFotos(e) {
  const files=Array.from(e.target.files); if (!files.length) return
  guardando.value=true
  const urls=await uploadArchivos('recursos',files)
  form.value.fotos=[...(form.value.fotos||[]),...urls]
  guardando.value=false
}

async function save() {
  if (!form.value.codigo.trim()||!form.value.nombre.trim()) return
  guardando.value=true
  await saveRecurso(form.value)
  await load()
  guardando.value=false
  showModal.value=false
}

function confirmDel(r) { delTarget.value=r; showConfirm.value=true }
async function doDelete() { await deleteRecurso(delTarget.value.id); await load(); showConfirm.value=false }
function tipoIcon(t) { return {Musical:'🎸',Vestuario:'👗',Deportivo:'⚽',Arte:'🎨',Otro:'📦'}[t]||'📦' }
function estColor(e) { return {Bueno:'badge-success',Regular:'badge-warning',Malo:'badge-danger'}[e]||'badge-neutral' }
</script>

<style scoped>
.inst-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}
.inst-card{background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem;display:flex;flex-direction:column;gap:.5rem;transition:var(--transition)}
.inst-card:hover{border-color:var(--border-light);transform:translateY(-2px)}
.inst-header{display:flex;justify-content:space-between;align-items:flex-start}
.inst-img{width:100%;height:120px;border-radius:var(--radius-sm);overflow:hidden;margin-bottom:.25rem}
.inst-img img{width:100%;height:100%;object-fit:cover}
.upload-zone{border:2px dashed var(--border-light);border-radius:var(--radius-md);padding:1rem;text-align:center;cursor:pointer;transition:var(--transition)}
.upload-zone:hover{border-color:var(--accent-cultura)}
.img-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:.5rem;margin-top:.5rem}
.img-preview{position:relative;aspect-ratio:1;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border)}
.img-preview img{width:100%;height:100%;object-fit:cover}
.img-remove{position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:18px;height:18px;font-size:.6rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
</style>