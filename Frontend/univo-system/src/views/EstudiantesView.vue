<template>
  <div class="fade-up">
    <div class="page-header flex justify-between items-center">
      <div><h1 class="page-title">Estudiantes</h1><p class="page-subtitle">Registro de participantes por área</p></div>
      <div class="flex gap-1">
        <div class="export-menu" ref="exportRef">
          <button @click="showExport=!showExport" class="btn btn-ghost">⬇ Exportar</button>
          <div v-if="showExport" class="export-dropdown">
            <button @click="doExportExcel" class="export-item">📊 Excel</button>
            <button @click="doExportWord"  class="export-item">📄 Word</button>
          </div>
        </div>
        <button @click="openModal()" class="btn btn-primary">＋ Nuevo Estudiante</button>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card" style="padding:1.25rem;margin-bottom:1.25rem">
      <div class="filters-row">
        <div class="form-group" style="flex:2">
          <label class="form-label">Buscar</label>
          <input v-model="filtros.search" type="text" class="form-control" placeholder="Nombre, carnet..." @input="load"/>
        </div>
        <div class="form-group">
          <label class="form-label">Área</label>
          <select v-model="filtros.area" class="form-control" @change="load">
            <option value="">Todas</option>
            <option v-for="a in areasOpts" :key="a">{{ a }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Sexo</label>
          <select v-model="filtros.sexo" class="form-control" @change="load">
            <option value="">Todos</option>
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Beca</label>
          <select v-model="filtros.becado" class="form-control" @change="load">
            <option value="">Todos</option>
            <option value="true">Becado</option>
            <option value="false">No becado</option>
          </select>
        </div>
        <button @click="limpiar" class="btn btn-ghost" style="align-self:flex-end">✕</button>
      </div>
      <div class="text-sm text-muted" style="margin-top:.75rem">
        <strong>{{ estudiantes.length }}</strong> estudiantes ·
        <span style="color:var(--accent-deporte)"><strong>{{ becados }}</strong> becados</span>
      </div>
    </div>

    <!-- Tabla -->
    <div class="card" style="padding:0">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Carnet</th><th>Nombre</th><th>Sexo</th><th>Área</th>
              <th>Carrera</th><th>Año Ingreso</th><th>Beca</th><th>Hrs Soc.</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cargando"><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-muted)">Cargando...</td></tr>
            <tr v-else-if="!estudiantes.length"><td colspan="10"><div class="empty-state"><div class="icon">👥</div><p>Sin estudiantes</p></div></td></tr>
            <tr v-for="e in estudiantes" :key="e.id">
              <td class="font-mono text-sm">{{ e.carnet }}</td>
              <td><strong>{{ e.nombre }}</strong></td>
              <td>{{ e.sexo==='M'?'♂':'♀' }}</td>
              <td><span class="badge" :class="badgeArea(e.area)">{{ e.area }}</span></td>
              <td class="text-sm">{{ e.carrera||'—' }}</td>
              <td class="text-sm">{{ e.anioIngreso||'—' }}</td>
              <td>
                <div v-if="e.becado">
                  <span class="badge badge-success">Becado</span>
                  <div class="text-xs text-muted" style="margin-top:.2rem">{{ e.institucionBeca||'' }}</div>
                </div>
                <span v-else class="badge badge-neutral">No</span>
              </td>
              <td class="font-mono text-sm" style="text-align:center">{{ e.horasSociales||0 }}</td>
              <td><span class="badge" :class="e.activo?'badge-success':'badge-danger'">{{ e.activo?'Activo':'Inactivo' }}</span></td>
              <td>
                <div class="flex gap-1">
                  <button @click="openModal(e)" class="btn-icon" title="Editar">✏</button>
                  <button @click="toggleActivo(e)" class="btn-icon">{{ e.activo?'⊘':'⊕' }}</button>
                  <button @click="confirmDel(e)" class="btn-icon" style="color:var(--accent-arte)">✕</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
     <Teleport to="body">
    <div v-if="showModal" class="modal-overlay" @click.self="showModal=false">
      <div class="modal" style="max-width:680px">
        <div class="modal-header">
          <h3 class="modal-title">{{ editing?'Editar':'Nuevo' }} Estudiante</h3>
          <button @click="showModal=false" class="modal-close">✕</button>
        </div>

        <!-- Sección datos personales -->
        <div class="seccion-titulo">📋 Datos Personales</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Carnet *</label>
            <input v-model="form.carnet" type="text" class="form-control" placeholder="00000"/>
          </div>
          <div class="form-group">
            <label class="form-label">Nombre completo *</label>
            <input v-model="form.nombre" type="text" class="form-control" placeholder="Nombre Apellido"/>
          </div>
          <div class="form-group">
            <label class="form-label">Sexo</label>
            <select v-model="form.sexo" class="form-control">
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de nacimiento</label>
            <input v-model="form.fechaNacimiento" type="date" class="form-control"/>
          </div>
          <div class="form-group">
            <label class="form-label">Teléfono</label>
            <input v-model="form.telefono" type="text" class="form-control" placeholder="7000-0000"/>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-control" placeholder="correo@mail.com"/>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Dirección de nacimiento</label>
            <input v-model="form.direccionNacimiento" type="text" class="form-control" placeholder="Ciudad, departamento de nacimiento"/>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Lugar de residencia actual</label>
            <input v-model="form.residencia" type="text" class="form-control" placeholder="Ciudad, departamento donde vive"/>
          </div>
        </div>

        <!-- Sección académica -->
        <div class="seccion-titulo" style="margin-top:1rem">🎓 Datos Académicos</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Facultad</label>
            <select v-model="form.facultad" class="form-control" @change="form.carrera=''">
              <option value="">— Seleccionar facultad —</option>
              <option v-for="f in facultades" :key="f.nombre">{{ f.nombre }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Carrera</label>
            <select v-model="form.carrera" class="form-control" :disabled="!form.facultad">
              <option value="">— Seleccionar carrera —</option>
              <option v-for="c in carrerasDeFacultad" :key="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Año de ingreso</label>
            <input v-model="form.anioIngreso" type="number" class="form-control" placeholder="2024" min="2000" max="2099"/>
          </div>
          <div class="form-group">
            <label class="form-label">Fecha de ingreso al área</label>
            <input v-model="form.fechaIngreso" type="date" class="form-control"/>
          </div>
        </div>

        <!-- Sección área -->
        <div class="seccion-titulo" style="margin-top:1rem">🎨 Área</div>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">Área *</label>
            <select v-model="form.area" class="form-control">
              <option v-for="a in areasOpts" :key="a">{{ a }}</option>
            </select>
          </div>
        </div>

        <!-- Sección beca -->
        <div class="seccion-titulo" style="margin-top:1rem">⭐ Beca</div>
        <div class="beca-check">
          <input v-model="form.becado" type="checkbox" id="becado" style="width:18px;height:18px;cursor:pointer"/>
          <label for="becado" style="cursor:pointer;font-size:.9rem;font-weight:500">Estudiante becado</label>
        </div>
        <div v-if="form.becado" class="grid-2" style="margin-top:.75rem">
          <div class="form-group">
            <label class="form-label">Institución que otorga la beca</label>
            <input v-model="form.institucionBeca" type="text" class="form-control" placeholder="Ej: MINED, Alcaldía, Empresa..."/>
          </div>
          <div class="form-group">
            <label class="form-label">Tipo / Clase de beca</label>
            <select v-model="form.tipoBeca" class="form-control">
              <option value="">— Seleccionar —</option>
              <option>Clase "A"</option>
              <option>Clase "B"</option>
              <option>Rendimiento Academico</option>
              <option>Arte, Cultura y Deporte</option>
              <option>Deportiva</option>
              <option>Convenios</option>
            </select>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Descripción de la beca</label>
            <input v-model="form.descripcionBeca" type="text" class="form-control" placeholder="Detalles adicionales de la beca..."/>
          </div>
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Notas</label>
          <textarea v-model="form.notas" class="form-control" rows="2"></textarea>
        </div>

        <div v-if="formError" class="alert alert-error" style="margin-top:.5rem">{{ formError }}</div>
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
        <p class="text-sm text-muted">¿Eliminar a <strong>{{ delTarget?.nombre }}</strong>?</p>
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
import { getEstudiantes, saveEstudiante, deleteEstudiante, areasDeUsuario } from '../utils/db.js'
import { exportToExcel, exportToWord } from '../utils/export.js'

const auth = useAuthStore()
const areasOpts = computed(() => areasDeUsuario(auth.user))

// ── Facultades y carreras ─────────────────────────────────
const facultades = [
  {
    nombre: 'Facultad de Ciencias Agropecuarias',
    carreras: [
      'Ingeniería Agronómica',
      'Licenciatura en Medicina Veterinaria'
    ]
  },
  {
    nombre: 'Facultad de Ciencias de la Salud',
    carreras: [
      'Doctorado en Cirugía Dental',
      'Doctorado en Medicina',
      'Licenciatura en Enfermería',
      'Licenciatura en Laboratorio Clínico',
      'Técnico en Optometría',
      'Tecnólogo en Enfermería'
    ]
  },
  {
    nombre: 'Facultad de Economía y Negocios',
    carreras: [
      'Licenciatura en Administración de Empresas',
      'Licenciatura en Contaduría Pública',
      'Licenciatura en Diseño Gráfico y Multimedia',
      'Licenciatura en Marketing y Publicidad Digital',
      'Licenciatura en Turismo',
      'Técnico en Banca y Negocios',
      'Técnico en Diseño Gráfico',
      'Técnico en Gestión Turística'
    ]
  },
  {
    nombre: 'Facultad de Ciencias y Humanidades',
    carreras: [
      'Licenciatura en Psicología',
      'Licenciatura en Comunicaciones',
      'Licenciatura en Idioma Inglés',
      'Licenciatura en Educación Inicial y Parvularia',
      'Licenciatura en Educación Física y Deportes',
      'Licenciatura en Psicopedagogía',
      'Profesorado en Matemáticas',
      'Profesorado en Idioma Inglés',
      'Profesorado en Educación Inicial y Parvularia',
      'Profesorado en Educación Artística',
      'Técnico en Idioma Inglés',
      'Técnico en Actividad Física y Entrenamiento Deportivo',
    ]
  },
  {
    nombre: 'Facultad de Ciencias Jurídicas',
    carreras: [
      'Licenciatura en Ciencias Jurídicas',
      'Licenciatura en Relaciones y Negocios Internacionales'
    ]
  },
  {
    nombre: 'Facultad de Ingeniería y Arquitectura',
    carreras: [
      'Arquitectura',
      'Ingeniería Civil',
      'Ingeniería en Agroindustria',
      'Ingeniería en Energía y Eficiencia Energética',
      'Ingeniería Industrial',
      'Ingeniería en Desarrollo de Software',
    ]
  },
  {
    nombre: 'Carreras 100% virtuales',
    carreras: [
      'Ingeniería en Desarrollo de Software',
      'Licenciatura en Administración de Empresas',
      'Licenciatura en Contaduría Pública',
      'Licenciatura en Marketing y Publicidad',
    ]
  }
]

const carrerasDeFacultad = computed(() => {
  const f = facultades.find(f => f.nombre === form.value.facultad)
  return f ? f.carreras : []
})

// ── Estado ────────────────────────────────────────────────
const estudiantes = ref([])
const cargando    = ref(false)
const guardando   = ref(false)
const filtros     = ref({ search:'', area:'', sexo:'', becado:'' })
const showModal   = ref(false)
const showExport  = ref(false)
const showConfirm = ref(false)
const editing     = ref(false)
const delTarget   = ref(null)
const formError   = ref('')
const exportRef   = ref(null)

const becados = computed(() => estudiantes.value.filter(e=>e.becado).length)

const defForm = () => ({
  carnet:'', nombre:'', sexo:'M', area:areasOpts.value[0]||'',
  fechaNacimiento:'', direccionNacimiento:'', residencia:'',
  telefono:'', email:'',
  facultad:'', carrera:'', anioIngreso:'',
  fechaIngreso:new Date().toISOString().split('T')[0],
  becado:false, institucionBeca:'', tipoBeca:'', descripcionBeca:'',
  horasSociales:0, notas:'', activo:true
})
const form = ref(defForm())

async function load() {
  cargando.value=true
  const f={}
  if (!auth.isAdmin && auth.userArea) f.grupo=auth.userArea
  if (filtros.value.area)            f.area  =filtros.value.area
  if (filtros.value.sexo)            f.sexo  =filtros.value.sexo
  if (filtros.value.becado!=='')     f.becado=filtros.value.becado
  if (filtros.value.search)          f.search=filtros.value.search
  estudiantes.value = await getEstudiantes(f)
  cargando.value=false
}

onMounted(async()=>{ await load(); document.addEventListener('click',handleOut) })
onUnmounted(()=>document.removeEventListener('click',handleOut))

async function limpiar() { filtros.value={search:'',area:'',sexo:'',becado:''}; await load() }

function openModal(e=null) {
  formError.value=''; editing.value=!!e
  form.value=e?{...e}:defForm()
  showModal.value=true
}

async function save() {
  if (!form.value.carnet.trim()) { formError.value='Carnet requerido'; return }
  if (!form.value.nombre.trim()) { formError.value='Nombre requerido'; return }
  if (!form.value.area)          { formError.value='Área requerida';   return }

  // ── Validar duplicados ────────────────────────────────
  const todos = await getEstudiantes({})

  // Verificar carnet duplicado
  const carnetDuplicado = todos.find(e =>
    e.carnet.trim().toLowerCase() === form.value.carnet.trim().toLowerCase() &&
    e.id !== form.value.id
  )
  if (carnetDuplicado) {
    formError.value = `Ya existe un estudiante con el carnet "${form.value.carnet}" — ${carnetDuplicado.nombre}`
    return
  }

  // Verificar nombre + área duplicado
  const nombreDuplicado = todos.find(e =>
    e.nombre.trim().toLowerCase() === form.value.nombre.trim().toLowerCase() &&
    e.area === form.value.area &&
    e.id !== form.value.id
  )
  if (nombreDuplicado) {
    formError.value = `Ya existe "${form.value.nombre}" registrado en ${form.value.area}`
    return
  }

  guardando.value = true
  await saveEstudiante(form.value)
  await load()
  guardando.value = false
  showModal.value = false
}

async function toggleActivo(e) { await saveEstudiante({...e,activo:!e.activo}); await load() }
function confirmDel(e) { delTarget.value=e; showConfirm.value=true }
async function doDelete() { await deleteEstudiante(delTarget.value.id); await load(); showConfirm.value=false }

function badgeArea(area) {
  if (['Danza Latina','Ballet de Proyección Folklórica'].includes(area)) return 'badge-arte'
  if (['Fútbol 11','Fútbol Sala','Voleibol','Baloncesto','Natación','Ajedrez','Pingpong','Artes Marciales'].includes(area)) return 'badge-deporte'
  if (area==='Taller de Pintura') return 'badge-warning'
  return 'badge-cultura'
}

function doExportExcel() {
  exportToExcel(estudiantes.value.map(e=>({
    'Carnet':e.carnet, 'Nombre':e.nombre, 'Sexo':e.sexo==='M'?'Masculino':'Femenino',
    'Área':e.area, 'Facultad':e.facultad||'', 'Carrera':e.carrera||'',
    'Año Ingreso':e.anioIngreso||'', 'F. Nacimiento':e.fechaNacimiento||'',
    'Dir. Nacimiento':e.direccionNacimiento||'', 'Residencia':e.residencia||'',
    'Becado':e.becado?'Sí':'No', 'Institución Beca':e.institucionBeca||'',
    'Tipo Beca':e.tipoBeca||'', 'Hrs Sociales':e.horasSociales||0,
    'Estado':e.activo?'Activo':'Inactivo'
  })), `Estudiantes_${new Date().toISOString().split('T')[0]}`, 'Estudiantes')
  showExport.value=false
}
function doExportWord() {
  exportToWord('Registro de Estudiantes',
    ['Carnet','Nombre','Sexo','Área','Facultad','Carrera','Año Ingreso','Becado','Institución Beca','Hrs Sociales'],
    estudiantes.value.map(e=>[e.carnet,e.nombre,e.sexo==='M'?'M':'F',e.area,e.facultad||'',e.carrera||'',e.anioIngreso||'',e.becado?'Sí':'No',e.institucionBeca||'',e.horasSociales||0]),
    `Estudiantes_${new Date().toISOString().split('T')[0]}`
  )
  showExport.value=false
}
function handleOut(e) { if(exportRef.value&&!exportRef.value.contains(e.target)) showExport.value=false }
</script>

<style scoped>
.filters-row{display:flex;gap:.75rem;flex-wrap:wrap;align-items:flex-end}
.seccion-titulo{font-size:.78rem;font-weight:700;color:var(--accent-cultura);text-transform:uppercase;letter-spacing:.08em;padding:.5rem 0;border-bottom:1px solid var(--border);margin-bottom:.75rem}
.beca-check{display:flex;align-items:center;gap:.6rem;padding:.5rem 0}
.export-menu{position:relative}
.export-dropdown{position:absolute;top:calc(100%+6px);right:0;background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-md);overflow:hidden;z-index:100;min-width:160px;box-shadow:var(--shadow-md)}
.export-item{display:block;width:100%;text-align:left;padding:.65rem 1rem;background:none;border:none;color:var(--text-primary);font-size:.85rem;cursor:pointer;transition:var(--transition)}
.export-item:hover{background:var(--bg-hover)}
</style>