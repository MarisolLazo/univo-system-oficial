<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Presentaciones</h1><p class="page-subtitle">Salidas externas con evidencias y recursos</p></div>
      <button @click="openModal()" class="btn btn-primary">＋ Nueva Presentación</button>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr><th>Título</th><th>Área</th><th>Fecha</th><th>Lugar</th><th>H. Salida</th><th>H. Regreso</th><th>Grupo</th><th>Estado</th><th>Evidencias</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            <tr v-if="cargando"><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</td></tr>
            <tr v-else-if="!presentaciones.length"><td colspan="10"><div class="empty-state"><div class="icon">🎭</div><p>Sin presentaciones</p></div></td></tr>
            <tr v-for="p in presentaciones" :key="p.id">
              <td><strong>{{ p.titulo }}</strong></td>
              <td><span class="badge badge-cultura">{{ p.area }}</span></td>
              <td class="font-mono text-sm">{{ p.fecha }}</td>
              <td class="text-sm">{{ p.lugar }}</td>
              <td class="font-mono text-sm">{{ p.horaSalida||'—' }}</td>
              <td class="font-mono text-sm">{{ p.horaRegreso||'—' }}</td>
              <td class="text-sm">{{ p.grupo||'—' }}</td>
              <td><span class="badge" :class="estColor(p.estado)">{{ p.estado }}</span></td>
              <td>
                <div class="flex gap-1">
                  <span v-if="p.imagenes?.length" class="badge badge-success">{{ p.imagenes.length }} imgs</span>
                  <span v-if="p.documentoPdf" class="badge badge-cultura">PDF</span>
                </div>
              </td>
              <td>
                <div class="flex gap-1">
                  <button @click="verDetalle(p)" class="btn-icon">👁</button>
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
      <div class="modal" style="max-width:680px">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing?'Editar':'Nueva' }} Presentación</h3>
          <button @click="showModal=false" class="modal-close">✕</button>
        </div>
        <div class="grid-2">
          <div class="form-group" style="grid-column:1/-1"><label class="form-label">Título *</label><input v-model="form.titulo" type="text" class="form-control" placeholder="Festival Cultural UNIVO..."/></div>
          <div class="form-group"><label class="form-label">Área</label>
            <select v-model="form.area" class="form-control">
              <option v-for="a in areasOpts" :key="a">{{ a }}</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Fecha</label><input v-model="form.fecha" type="date" class="form-control"/></div>
          <div class="form-group"><label class="form-label">Lugar</label><input v-model="form.lugar" type="text" class="form-control" placeholder="Auditorio Central..."/></div>
          <div class="form-group"><label class="form-label">Encargado</label><input v-model="form.encargado" type="text" class="form-control"/></div>
          <div class="form-group"><label class="form-label">Hora de Salida</label><input v-model="form.horaSalida" type="time" class="form-control"/></div>
          <div class="form-group"><label class="form-label">Hora de Regreso</label><input v-model="form.horaRegreso" type="time" class="form-control"/></div>
          <div class="form-group"><label class="form-label">Grupo que sale</label><input v-model="form.grupo" type="text" class="form-control" placeholder="Ej: Marimba, Orquesta..."/></div>
          <div class="form-group"><label class="form-label">Estado</label>
            <select v-model="form.estado" class="form-control"><option>Programada</option><option>En Curso</option><option>Completada</option><option>Cancelada</option></select>
          </div>
        </div>

        <!-- Recursos llevados -->
        <div style="margin-top:1rem">
          <div class="flex justify-between items-center" style="margin-bottom:.5rem">
            <label class="form-label">Recursos/Instrumentos llevados</label>
            <button @click="form.recursosLlevados.push({nombre:'',estadoSalida:'Bueno',estadoRegreso:''})" class="btn btn-ghost btn-sm">＋ Agregar</button>
          </div>
          <div v-for="(r,i) in form.recursosLlevados" :key="i" style="display:flex;gap:.5rem;margin-bottom:.4rem;align-items:center">
            <input v-model="r.nombre" type="text" class="form-control" style="flex:2" placeholder="Nombre del recurso"/>
            <select v-model="r.estadoSalida"  class="form-control" style="flex:1"><option>Bueno</option><option>Regular</option><option>Malo</option></select>
            <select v-model="r.estadoRegreso" class="form-control" style="flex:1"><option value="">Regreso...</option><option>Bueno</option><option>Regular</option><option>Malo</option></select>
            <button @click="form.recursosLlevados.splice(i,1)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
          </div>
        </div>

        <!-- Subir PDF -->
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Solicitud / Documento PDF</label>
          <div class="upload-zone" @click="$refs.pdfInput.click()" @dragover.prevent @drop.prevent="handleDropPdf">
            <input ref="pdfInput" type="file" accept=".pdf" style="display:none" @change="handlePdf"/>
            <div v-if="form.documentoPdf">
              <span style="color:var(--accent-cultura)">📄 PDF cargado</span>
              <button @click.stop="form.documentoPdf=null" style="margin-left:.5rem;color:var(--accent-arte);background:none;border:none;cursor:pointer">✕</button>
            </div>
            <div v-else class="text-sm text-muted">Haz clic o arrastra un PDF aquí</div>
          </div>
        </div>

        <!-- Subir imágenes -->
        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Imágenes de evidencia</label>
          <div class="upload-zone" @click="$refs.imgInput.click()" @dragover.prevent @drop.prevent="handleDropImg">
            <input ref="imgInput" type="file" accept="image/*" multiple style="display:none" @change="handleImgs"/>
            <div class="text-sm text-muted">Haz clic o arrastra imágenes aquí (múltiples)</div>
          </div>
          <div v-if="form.imagenes?.length" class="img-preview-grid">
            <div v-for="(img,i) in form.imagenes" :key="i" class="img-preview">
              <img :src="getImgUrl(img)" alt="evidencia"/>
              <button @click="form.imagenes.splice(i,1)" class="img-remove">✕</button>
            </div>
          </div>
        </div>

        <div class="form-group" style="margin-top:.75rem"><label class="form-label">Notas</label><textarea v-model="form.notas" class="form-control" rows="2"></textarea></div>
        <div class="modal-footer">
          <button @click="showModal=false" class="btn btn-ghost">Cancelar</button>
          <button @click="save" class="btn btn-primary" :disabled="guardando">{{ guardando?'Guardando...':(editing?'Guardar':'Registrar') }}</button>
        </div>
      </div>
    </div>
</Teleport>
    <!-- Modal detalle -->
    <div v-if="showDetalle && detalleP" class="modal-overlay" @click.self="showDetalle=false">
      <div class="modal" style="max-width:600px">
        <div class="modal-header"><h3 class="modal-title">{{ detalleP.titulo }}</h3><button @click="showDetalle=false" class="modal-close">✕</button></div>
        <div class="grid-2" style="margin-bottom:1rem">
          <div><span class="form-label" style="display:block">Área</span>{{ detalleP.area }}</div>
          <div><span class="form-label" style="display:block">Fecha</span>{{ detalleP.fecha }}</div>
          <div><span class="form-label" style="display:block">Lugar</span>{{ detalleP.lugar }}</div>
          <div><span class="form-label" style="display:block">Grupo</span>{{ detalleP.grupo||'—' }}</div>
          <div><span class="form-label" style="display:block">Hora salida</span>{{ detalleP.horaSalida||'—' }}</div>
          <div><span class="form-label" style="display:block">Hora regreso</span>{{ detalleP.horaRegreso||'—' }}</div>
        </div>
        <hr class="divider"/>
        <div v-if="detalleP.recursosLlevados?.length">
          <div class="form-label" style="margin-bottom:.5rem">Recursos</div>
          <div v-for="r in detalleP.recursosLlevados" :key="r.nombre" style="display:flex;justify-content:space-between;padding:.4rem .6rem;background:var(--bg-surface);border-radius:var(--radius-sm);margin-bottom:.3rem;font-size:.85rem">
            <span>{{ r.nombre }}</span>
            <div class="flex gap-1">
              <span class="badge badge-neutral">Salida: {{ r.estadoSalida }}</span>
              <span v-if="r.estadoRegreso" class="badge badge-success">Regreso: {{ r.estadoRegreso }}</span>
            </div>
          </div>
        </div>
        <div v-if="detalleP.documentoPdf" style="margin-top:1rem">
          <div class="form-label" style="margin-bottom:.5rem">Documento PDF</div>
          <a :href="getImgUrl(detalleP.documentoPdf)" target="_blank" class="btn btn-ghost btn-sm">📄 Ver PDF</a>
        </div>
        <div v-if="detalleP.imagenes?.length" style="margin-top:1rem">
          <div class="form-label" style="margin-bottom:.5rem">Imágenes ({{ detalleP.imagenes.length }})</div>
          <div class="img-preview-grid">
            <div v-for="(img,i) in detalleP.imagenes" :key="i" class="img-preview" style="cursor:pointer" @click="abrirImg(img)">
              <img :src="getImgUrl(img)" alt="evidencia"/>
            </div>
          </div>
        </div>
        <div class="modal-footer"><button @click="showDetalle=false" class="btn btn-ghost">Cerrar</button></div>
      </div>
    </div>

    <!-- Confirm -->
    <div v-if="showConfirm" class="modal-overlay" @click.self="showConfirm=false">
      <div class="modal" style="max-width:340px">
        <div class="modal-header"><h3 class="modal-title">Eliminar</h3><button @click="showConfirm=false" class="modal-close">✕</button></div>
        <p class="text-sm text-muted">¿Eliminar <strong>{{ delTarget?.titulo }}</strong>?</p>
        <div class="modal-footer"><button @click="showConfirm=false" class="btn btn-ghost">Cancelar</button><button @click="doDelete" class="btn btn-danger">Eliminar</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../store/auth.js'
import { getPresentaciones, savePresentacion, deletePresentacion, uploadArchivos, urlArchivo, areasDeUsuario } from '../utils/db.js'

const auth = useAuthStore()
const areasOpts = computed(() => areasDeUsuario(auth.user))

const presentaciones = ref([])
const cargando  = ref(false)
const guardando = ref(false)
const showModal   = ref(false)
const showDetalle = ref(false)
const showConfirm = ref(false)
const editing   = ref(false)
const detalleP  = ref(null)
const delTarget = ref(null)
const pdfInput  = ref(null)
const imgInput  = ref(null)

const defForm = () => ({
  titulo:'', area:areasOpts.value[0]||'', fecha:new Date().toISOString().split('T')[0],
  lugar:'', encargado:'', horaSalida:'', horaRegreso:'', grupo:'',
  estado:'Programada', recursosLlevados:[], documentoPdf:null, imagenes:[], notas:''
})
const form = ref(defForm())

async function load() {
  cargando.value=true
  const f={}
  if (!auth.isAdmin && auth.userArea) f.grupo=auth.userArea
  presentaciones.value = await getPresentaciones(f)
  cargando.value=false
}
onMounted(async()=>{ await load() })

function openModal(p=null) {
  editing.value=!!p
  form.value=p?{...p,recursosLlevados:[...(p.recursosLlevados||[])],imagenes:[...(p.imagenes||[])]}:defForm()
  showModal.value=true
}

async function handlePdf(e) {
  const file = e.target.files[0]; if (!file) return
  guardando.value=true
  const urls = await uploadArchivos('presentaciones', [file])
  form.value.documentoPdf = urls[0]||null
  guardando.value=false
}
async function handleImgs(e) {
  const files = Array.from(e.target.files); if (!files.length) return
  guardando.value=true
  const urls = await uploadArchivos('presentaciones', files)
  form.value.imagenes = [...(form.value.imagenes||[]), ...urls]
  guardando.value=false
}
function handleDropPdf(e) { const file=e.dataTransfer.files[0]; if(file) { const dt=new DataTransfer(); dt.items.add(file); pdfInput.value.files=dt.files; handlePdf({target:pdfInput.value}) } }
function handleDropImg(e) { const files=Array.from(e.dataTransfer.files); if(files.length) { const dt=new DataTransfer(); files.forEach(f=>dt.items.add(f)); imgInput.value.files=dt.files; handleImgs({target:imgInput.value}) } }

async function save() {
  if (!form.value.titulo.trim()) return
  guardando.value=true
  await savePresentacion(form.value)
  await load()
  guardando.value=false
  showModal.value=false
}

function verDetalle(p) { detalleP.value=p; showDetalle.value=true }
function confirmDel(p) { delTarget.value=p; showConfirm.value=true }
async function doDelete() { await deletePresentacion(delTarget.value.id); await load(); showConfirm.value=false }
function getImgUrl(url) { return urlArchivo(url) }
function abrirImg(url) { window.open(urlArchivo(url),'_blank') }
function estColor(e) { return {Programada:'badge-cultura','En Curso':'badge-warning',Completada:'badge-success',Cancelada:'badge-danger'}[e]||'badge-neutral' }
</script>

<style scoped>
.upload-zone{border:2px dashed var(--border-light);border-radius:var(--radius-md);padding:1.25rem;text-align:center;cursor:pointer;transition:var(--transition)}
.upload-zone:hover{border-color:var(--accent-cultura);background:rgba(124,106,247,.05)}
.img-preview-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:.5rem;margin-top:.75rem}
.img-preview{position:relative;aspect-ratio:1;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border)}
.img-preview img{width:100%;height:100%;object-fit:cover}
.img-remove{position:absolute;top:3px;right:3px;background:rgba(0,0,0,.6);color:white;border:none;border-radius:50%;width:20px;height:20px;font-size:.65rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
</style>