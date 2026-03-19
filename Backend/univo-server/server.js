const express = require('express')
const cors    = require('cors')
const fs      = require('fs')
const path    = require('path')
const multer  = require('multer')

const app     = express()
const PORT    = 3000
const DB_FILE = path.join(__dirname, 'db.json')
const UPLOADS = path.join(__dirname, 'uploads')

// Crear carpeta uploads si no existe
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true })

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(UPLOADS))

// ── Multer para archivos ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = req.params.tipo || 'general'
    const dir = path.join(UPLOADS, sub)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.round(Math.random()*1e6)}${ext}`
    cb(null, name)
  }
})
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } })

// ── Áreas ─────────────────────────────────────────────────
const AREAS_ARTE_CULTURA = [
  'Solistas - Violinistas', 'Solistas - Saxofón', 'Solistas - Cantantes',
  'Orquesta de Cámara', 'Grupo Andino', 'Mariachi', 'Marimba'
]
const AREAS_DANZA = ['Danza Latina', 'Ballet de Proyección Folklórica']
const AREAS_DEPORTE = [
  'Fútbol 11', 'Fútbol Sala', 'Voleibol', 'Baloncesto',
  'Natación', 'Ajedrez', 'Pingpong', 'Artes Marciales'
]
const AREAS_PINTURA = ['Taller de Pintura']
const TODAS_AREAS = [...AREAS_ARTE_CULTURA, ...AREAS_DANZA, ...AREAS_DEPORTE, ...AREAS_PINTURA]

const AREAS_POR_ROL = {
  'Arte y Cultura': AREAS_ARTE_CULTURA,
  'Danza':          AREAS_DANZA,
  'Deporte':        AREAS_DEPORTE,
  'Pintura':        AREAS_PINTURA,
}

// ── DB helpers ────────────────────────────────────────────
const defaultDB = {
  users: [
    { id:1, nombre:'Admin General',         email:'admin@univo.edu',       password:'admin123',    rol:'admin',     area:null,            activo:true },
    { id:2, nombre:'Encargado Arte/Cultura', email:'artecultura@univo.edu', password:'arte123',     rol:'encargado', area:'Arte y Cultura', activo:true },
    { id:3, nombre:'Encargado Danza',        email:'danza@univo.edu',       password:'danza123',    rol:'encargado', area:'Danza',          activo:true },
    { id:4, nombre:'Encargado Deporte',      email:'deporte@univo.edu',     password:'deporte123',  rol:'encargado', area:'Deporte',        activo:true },
    { id:5, nombre:'Encargado Pintura',      email:'pintura@univo.edu',     password:'pintura123',  rol:'encargado', area:'Pintura',        activo:true },
  ],
  estudiantes: [],
  asistencias: [],
  actividades: [],
  presentaciones: [],
  prestamos: [],
  recursos: [],
  permisos: [],
  reportes: [],
  nextIds: {
    users:6, estudiantes:1, asistencias:1, actividades:1,
    presentaciones:1, prestamos:1, recursos:1, permisos:1
  }
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) { fs.writeFileSync(DB_FILE, JSON.stringify(defaultDB, null, 2)); return JSON.parse(JSON.stringify(defaultDB)) }
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  } catch { return JSON.parse(JSON.stringify(defaultDB)) }
}
function writeDB(data) { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8') }
function nextId(db, table) { const id = db.nextIds[table]||1; db.nextIds[table]=id+1; return id }

function areasDeRol(area) {
  if (!area) return TODAS_AREAS
  return AREAS_POR_ROL[area] || []
}

// ── LOGIN ─────────────────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  const user = readDB().users.find(u => u.email===email && u.password===password && u.activo)
  if (user) res.json({ ok:true, user })
  else      res.status(401).json({ ok:false, error:'Credenciales incorrectas' })
})

// ── ÁREAS INFO ────────────────────────────────────────────
app.get('/api/areas', (req, res) => {
  res.json({
    arteYCultura: AREAS_ARTE_CULTURA,
    danza:        AREAS_DANZA,
    deporte:      AREAS_DEPORTE,
    pintura:      AREAS_PINTURA,
    todas:        TODAS_AREAS,
    porRol:       AREAS_POR_ROL,
  })
})

// ── UPLOAD archivos ───────────────────────────────────────
app.post('/api/upload/:tipo', upload.array('archivos', 20), (req, res) => {
  const urls = req.files.map(f => `/uploads/${req.params.tipo}/${f.filename}`)
  res.json({ ok:true, urls })
})
app.delete('/api/upload', (req, res) => {
  const { url } = req.body
  try {
    const filePath = path.join(__dirname, url)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    res.json({ ok:true })
  } catch { res.json({ ok:false }) }
})

// ── STATS Dashboard ───────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const db  = readDB()
  const hoy = new Date().toISOString().split('T')[0]
  const est = db.estudiantes

  const porArea = {}
  TODAS_AREAS.forEach(a => { porArea[a] = est.filter(e => e.area===a && e.activo).length })

  const porGrupo = {
    'Arte y Cultura': AREAS_ARTE_CULTURA.reduce((s,a)=>s+est.filter(e=>e.area===a&&e.activo).length,0),
    'Danza':          AREAS_DANZA.reduce((s,a)=>s+est.filter(e=>e.area===a&&e.activo).length,0),
    'Deporte':        AREAS_DEPORTE.reduce((s,a)=>s+est.filter(e=>e.area===a&&e.activo).length,0),
    'Pintura':        AREAS_PINTURA.reduce((s,a)=>s+est.filter(e=>e.area===a&&e.activo).length,0),
  }

  res.json({
    totalEstudiantes:   est.filter(e=>e.activo).length,
    becados:            est.filter(e=>e.becado&&e.activo).length,
    noBecados:          est.filter(e=>!e.becado&&e.activo).length,
    masculinos:         est.filter(e=>e.sexo==='M'&&e.activo).length,
    femeninos:          est.filter(e=>e.sexo==='F'&&e.activo).length,
    porArea,
    porGrupo,
    totalAsistencias:   db.asistencias.length,
    asistenciasHoy:     db.asistencias.filter(a=>a.fecha===hoy).length,
    presentesHoy:       db.asistencias.filter(a=>a.fecha===hoy&&a.estado==='Presente').length,
    totalActividades:   db.actividades.length,
    totalPresentaciones:db.presentaciones.length,
    prestamosActivos:   db.prestamos.filter(p=>!p.entregado).length,
    permisosPendientes: db.permisos.filter(p=>p.estado==='Pendiente').length,
    totalRecursos:      db.recursos.filter(r=>r.activo).length,
  })
})

// ── ESTUDIANTES ───────────────────────────────────────────
app.get('/api/estudiantes', (req, res) => {
  const db = readDB()
  let list = db.estudiantes
  const { area, sexo, becado, activo, search, grupo } = req.query
  if (grupo) {
    const areas = AREAS_POR_ROL[grupo] || []
    list = list.filter(e => areas.includes(e.area))
  }
  if (area)   list = list.filter(e => e.area===area)
  if (sexo)   list = list.filter(e => e.sexo===sexo)
  if (becado!==undefined&&becado!=='') list = list.filter(e => String(e.becado)===becado)
  if (activo!==undefined&&activo!='')  list = list.filter(e => String(e.activo)===activo)
  if (search) { const q=search.toLowerCase(); list=list.filter(e=>e.nombre.toLowerCase().includes(q)||e.carnet.includes(q)||(e.carrera||'').toLowerCase().includes(q)) }
  res.json(list)
})

app.post('/api/estudiantes', (req, res) => {
  const db = readDB()
  const e  = req.body
  if (e.id) { const i=db.estudiantes.findIndex(x=>x.id===e.id); if(i!==-1) db.estudiantes[i]={...db.estudiantes[i],...e} }
  else       { db.estudiantes.push({...e, id:nextId(db,'estudiantes'), horasSociales:0}) }
  writeDB(db); res.json({ ok:true })
})

app.post('/api/estudiantes/:id/horas', (req, res) => {
  const db = readDB()
  const i  = db.estudiantes.findIndex(e=>e.id===Number(req.params.id))
  if (i!==-1) {
    db.estudiantes[i].horasSociales = (db.estudiantes[i].horasSociales||0) + Number(req.body.horas||0)
    writeDB(db)
  }
  res.json({ ok:true })
})

app.delete('/api/estudiantes/:id', (req, res) => {
  const db = readDB()
  db.estudiantes = db.estudiantes.filter(e=>e.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── ASISTENCIAS ───────────────────────────────────────────
app.get('/api/asistencias', (req, res) => {
  const db = readDB()
  let list = db.asistencias
  const { area, fecha, estudianteId, grupo, semana, mes } = req.query
  if (grupo) { const areas=AREAS_POR_ROL[grupo]||[]; list=list.filter(a=>areas.includes(a.area)) }
  if (area)  list=list.filter(a=>a.area===area)
  if (fecha) list=list.filter(a=>a.fecha===fecha)
  if (estudianteId) list=list.filter(a=>a.estudianteId===Number(estudianteId))
  if (semana) {
    const d=new Date(semana); const fin=new Date(d); fin.setDate(d.getDate()+6)
    list=list.filter(a=>{ const f=new Date(a.fecha); return f>=d&&f<=fin })
  }
  if (mes) { const [y,m]=mes.split('-'); list=list.filter(a=>{ const f=new Date(a.fecha); return f.getFullYear()===Number(y)&&(f.getMonth()+1)===Number(m) }) }
  res.json(list)
})

app.post('/api/asistencias', (req, res) => {
  const db = readDB()
  const a  = req.body
  if (a.id) { const i=db.asistencias.findIndex(x=>x.id===a.id); if(i!==-1) db.asistencias[i]={...db.asistencias[i],...a} }
  else       { db.asistencias.push({...a, id:nextId(db,'asistencias')}) }
  writeDB(db); res.json({ ok:true })
})

app.post('/api/asistencias/masiva', (req, res) => {
  const db = readDB()
  const { fecha, area, actividadId, registros } = req.body
  registros.forEach(r => {
    const existe = db.asistencias.find(a=>a.estudianteId===r.estudianteId&&a.fecha===fecha&&a.area===area)
    if (existe) { existe.estado=r.estado; existe.notas=r.notas||'' }
    else        { db.asistencias.push({ id:db.nextIds.asistencias++, estudianteId:r.estudianteId, fecha, area, actividadId:actividadId||null, estado:r.estado, notas:r.notas||'', fotos:[] }) }
    // Si es becado y presente, sumar hora
    if (r.estado==='Presente') {
      const est = db.estudiantes.find(e=>e.id===r.estudianteId)
      if (est?.becado) est.horasSociales=(est.horasSociales||0)+1
    }
  })
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/asistencias/:id', (req, res) => {
  const db = readDB()
  db.asistencias=db.asistencias.filter(a=>a.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── ACTIVIDADES ───────────────────────────────────────────
app.get('/api/actividades', (req, res) => {
  const db = readDB()
  let list = db.actividades
  const { area, tipo, grupo } = req.query
  if (grupo) { const areas=AREAS_POR_ROL[grupo]||[]; list=list.filter(a=>areas.includes(a.area)) }
  if (area)  list=list.filter(a=>a.area===area)
  if (tipo)  list=list.filter(a=>a.tipo===tipo)
  res.json(list)
})

app.post('/api/actividades', (req, res) => {
  const db = readDB()
  const a  = req.body
  if (a.id) { const i=db.actividades.findIndex(x=>x.id===a.id); if(i!==-1) db.actividades[i]={...db.actividades[i],...a} }
  else       { db.actividades.push({...a, id:nextId(db,'actividades')}) }
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/actividades/:id', (req, res) => {
  const db = readDB()
  db.actividades=db.actividades.filter(a=>a.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── PRESENTACIONES ────────────────────────────────────────
app.get('/api/presentaciones', (req, res) => {
  const db = readDB()
  let list = db.presentaciones
  const { area, grupo } = req.query
  if (grupo) { const areas=AREAS_POR_ROL[grupo]||[]; list=list.filter(p=>areas.includes(p.area)) }
  if (area)  list=list.filter(p=>p.area===area)
  res.json(list)
})

app.post('/api/presentaciones', (req, res) => {
  const db = readDB()
  const p  = req.body
  if (p.id) { const i=db.presentaciones.findIndex(x=>x.id===p.id); if(i!==-1) db.presentaciones[i]={...db.presentaciones[i],...p} }
  else       { db.presentaciones.push({...p, id:nextId(db,'presentaciones')}) }
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/presentaciones/:id', (req, res) => {
  const db = readDB()
  db.presentaciones=db.presentaciones.filter(p=>p.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── RECURSOS (Inventario) ─────────────────────────────────
app.get('/api/recursos', (req, res) => {
  const db = readDB()
  let list = db.recursos
  const { area, tipo, search, grupo } = req.query
  if (grupo)  { const areas=AREAS_POR_ROL[grupo]||[]; list=list.filter(r=>areas.includes(r.area)) }
  if (area)   list=list.filter(r=>r.area===area)
  if (tipo)   list=list.filter(r=>r.tipo===tipo)
  if (search) { const q=search.toLowerCase(); list=list.filter(r=>r.nombre.toLowerCase().includes(q)||r.codigo.toLowerCase().includes(q)) }
  res.json(list)
})

app.post('/api/recursos', (req, res) => {
  const db = readDB()
  const r  = req.body
  if (r.id) { const i=db.recursos.findIndex(x=>x.id===r.id); if(i!==-1) db.recursos[i]={...db.recursos[i],...r} }
  else       { db.recursos.push({...r, id:nextId(db,'recursos')}) }
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/recursos/:id', (req, res) => {
  const db = readDB()
  db.recursos=db.recursos.filter(r=>r.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── PRÉSTAMOS ─────────────────────────────────────────────
app.get('/api/prestamos', (req, res) => {
  const db = readDB()
  let list = db.prestamos
  const { entregado, search } = req.query
  if (entregado!==undefined&&entregado!=='') list=list.filter(p=>String(p.entregado)===entregado)
  if (search) { const q=search.toLowerCase(); list=list.filter(p=>p.estudianteNombre.toLowerCase().includes(q)||p.estudianteCarnet.includes(q)) }
  res.json(list)
})

app.post('/api/prestamos', (req, res) => {
  const db = readDB()
  const p  = req.body
  if (p.id) { const i=db.prestamos.findIndex(x=>x.id===p.id); if(i!==-1) db.prestamos[i]={...db.prestamos[i],...p} }
  else       { db.prestamos.push({...p, id:nextId(db,'prestamos')}) }
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/prestamos/:id', (req, res) => {
  const db = readDB()
  db.prestamos=db.prestamos.filter(p=>p.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── PERMISOS ──────────────────────────────────────────────
app.get('/api/permisos', (req, res) => {
  const db = readDB()
  let list = db.permisos
  const { area, estado, grupo } = req.query
  if (grupo)  { const areas=AREAS_POR_ROL[grupo]||[]; list=list.filter(p=>areas.includes(p.area)) }
  if (area)   list=list.filter(p=>p.area===area)
  if (estado) list=list.filter(p=>p.estado===estado)
  res.json(list)
})

app.post('/api/permisos', (req, res) => {
  const db = readDB()
  const p  = req.body
  if (p.id) { const i=db.permisos.findIndex(x=>x.id===p.id); if(i!==-1) db.permisos[i]={...db.permisos[i],...p} }
  else       { db.permisos.push({...p, id:nextId(db,'permisos')}) }
  writeDB(db); res.json({ ok:true })
})

app.delete('/api/permisos/:id', (req, res) => {
  const db = readDB()
  db.permisos=db.permisos.filter(p=>p.id!==Number(req.params.id))
  writeDB(db); res.json({ ok:true })
})

// ── RESET ─────────────────────────────────────────────────
app.post('/api/reset', (req, res) => {
  writeDB(JSON.parse(JSON.stringify(defaultDB)))
  res.json({ ok:true })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log('==========================================')
  console.log(`  Servidor UNIVO v2 — Puerto ${PORT}`)
  console.log('==========================================')
  console.log('  Esta PC:    http://localhost:3000')
  console.log('  Otras PCs:  http://[TU-IP]:3000')
  console.log('  Busca IP:   ipconfig en CMD')
  console.log('==========================================')
  console.log('\n  Cuentas:')
  console.log('  admin@univo.edu        / admin123')
  console.log('  artecultura@univo.edu  / arte123')
  console.log('  danza@univo.edu        / danza123')
  console.log('  deporte@univo.edu      / deporte123')
  console.log('  pintura@univo.edu      / pintura123')
  console.log('==========================================')
})