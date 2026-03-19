const API = 'http://localhost:3000/api'
// En otras PCs cambia localhost por la IP del servidor: 'http://192.168.X.X:3000/api'

export const AREAS_ARTE_CULTURA = ['Solistas - Violinistas','Solistas - Saxofón','Solistas - Cantantes','Orquesta de Cámara','Grupo Andino','Mariachi','Marimba']
export const AREAS_DANZA        = ['Danza Latina','Ballet de Proyección Folklórica']
export const AREAS_DEPORTE      = ['Fútbol 11','Fútbol Sala','Voleibol','Baloncesto','Natación','Ajedrez','Pingpong','Artes Marciales']
export const AREAS_PINTURA      = ['Taller de Pintura']
export const TODAS_AREAS        = [...AREAS_ARTE_CULTURA,...AREAS_DANZA,...AREAS_DEPORTE,...AREAS_PINTURA]

export const AREAS_POR_ROL = {
  'Arte y Cultura': AREAS_ARTE_CULTURA,
  'Danza':          AREAS_DANZA,
  'Deporte':        AREAS_DEPORTE,
  'Pintura':        AREAS_PINTURA,
}

export function areasDeUsuario(user) {
  if (!user || user.rol==='admin') return TODAS_AREAS
  return AREAS_POR_ROL[user.area] || []
}

async function get(url) {
  const res = await fetch(`${API}${url}`)
  return res.json()
}
async function post(url, data) {
  await fetch(`${API}${url}`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
}
async function del(url) {
  await fetch(`${API}${url}`, { method:'DELETE' })
}
function toQuery(f={}) {
  const p = new URLSearchParams()
  Object.entries(f).forEach(([k,v])=>{ if(v!==undefined&&v!==''&&v!==null) p.append(k,v) })
  const s=p.toString(); return s?`?${s}`:''
}

// ── UPLOAD ────────────────────────────────────────────────
export async function uploadArchivos(tipo, archivos) {
  const form = new FormData()
  archivos.forEach(f => form.append('archivos', f))
  const res  = await fetch(`${API}/upload/${tipo}`, { method:'POST', body:form })
  const data = await res.json()
  return data.urls || []
}

export function urlArchivo(url) {
  return `http://localhost:3000${url}`
  // En otras PCs: return `http://192.168.X.X:3000${url}`
}

// ── LOGIN ─────────────────────────────────────────────────
export async function loginUser(email, password) {
  const res  = await fetch(`${API}/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })
  const data = await res.json()
  return data.ok ? data.user : null
}

// ── STATS ─────────────────────────────────────────────────
export async function getDashboardStats()            { return get('/stats') }

// ── ESTUDIANTES ───────────────────────────────────────────
export async function getEstudiantes(f={})           { return get(`/estudiantes${toQuery(f)}`) }
export async function saveEstudiante(e)              { return post('/estudiantes', e) }
export async function deleteEstudiante(id)           { return del(`/estudiantes/${id}`) }
export async function agregarHoras(id, horas)        { return post(`/estudiantes/${id}/horas`, {horas}) }

// ── ASISTENCIAS ───────────────────────────────────────────
export async function getAsistencias(f={})           { return get(`/asistencias${toQuery(f)}`) }
export async function saveAsistencia(a)              { return post('/asistencias', a) }
export async function deleteAsistencia(id)           { return del(`/asistencias/${id}`) }
export async function registrarAsistenciaMasiva(fecha, area, actividadId, registros) {
  return post('/asistencias/masiva', { fecha, area, actividadId, registros })
}

// ── ACTIVIDADES ───────────────────────────────────────────
export async function getActividades(f={})           { return get(`/actividades${toQuery(f)}`) }
export async function saveActividad(a)               { return post('/actividades', a) }
export async function deleteActividad(id)            { return del(`/actividades/${id}`) }

// ── PRESENTACIONES ────────────────────────────────────────
export async function getPresentaciones(f={})        { return get(`/presentaciones${toQuery(f)}`) }
export async function savePresentacion(p)            { return post('/presentaciones', p) }
export async function deletePresentacion(id)         { return del(`/presentaciones/${id}`) }

// ── RECURSOS ──────────────────────────────────────────────
export async function getRecursos(f={})              { return get(`/recursos${toQuery(f)}`) }
export async function saveRecurso(r)                 { return post('/recursos', r) }
export async function deleteRecurso(id)              { return del(`/recursos/${id}`) }

// ── PRÉSTAMOS ─────────────────────────────────────────────
export async function getPrestamos(f={})             { return get(`/prestamos${toQuery(f)}`) }
export async function savePrestamo(p)                { return post('/prestamos', p) }
export async function deletePrestamo(id)             { return del(`/prestamos/${id}`) }

// ── PERMISOS ──────────────────────────────────────────────
export async function getPermisos(f={})              { return get(`/permisos${toQuery(f)}`) }
export async function savePermiso(p)                 { return post('/permisos', p) }
export async function deletePermiso(id)              { return del(`/permisos/${id}`) }

// ── RESET ─────────────────────────────────────────────────
export async function resetDB()                      { return post('/reset', {}) }