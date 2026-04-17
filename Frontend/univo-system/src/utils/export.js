import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// ─────────────────────────────────────────────────────────────────────────────
// GENÉRICOS
// ─────────────────────────────────────────────────────────────────────────────

export function exportToExcel(data, filename, sheetName = 'Hoja1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  const maxWidths = {}
  data.forEach(row =>
    Object.entries(row).forEach(([k, v]) => {
      const l = Math.max(k.length, String(v ?? '').length)
      maxWidths[k] = Math.max(maxWidths[k] || 0, l)
    })
  )
  ws['!cols'] = Object.values(maxWidths).map(w => ({ wch: Math.min(w + 2, 40) }))
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${filename}.xlsx`)
}

export function exportToWord(title, headers, rows, filename) {
  const tableRows = rows
    .map(row => `<tr>${row.map(cell => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:11pt;">${cell ?? ''}</td>`).join('')}</tr>`)
    .join('')
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset='utf-8'><title>${title}</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;margin:2cm;color:#1a1a2e}
  h1{font-size:16pt;color:#1a1a2e;margin-bottom:4px}
  .sub{font-size:10pt;color:#666;margin-bottom:20px}
  table{border-collapse:collapse;width:100%;margin-top:12px}
  th{background:#1a1a2e;color:white;padding:7px 10px;font-size:10pt;text-align:left;border:1px solid #1a1a2e}
  tr:nth-child(even) td{background:#f5f5f8}
  .footer{margin-top:24px;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:8px}
</style>
</head><body>
<h1>Universidad de Oriente — UNIVO</h1>
<div class='sub'>${title} | Generado: ${new Date().toLocaleDateString('es-SV', { dateStyle: 'full' })}</div>
<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
<div class='footer'>Sistema de Gestión ACyD — UNIVO © ${new Date().getFullYear()}</div>
</body></html>`
  saveAs(new Blob(['\ufeff', html], { type: 'application/msword' }), `${filename}.doc`)
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTA DE PERMISO — WORD (.doc)
// ─────────────────────────────────────────────────────────────────────────────

export function exportPermisoWord(permiso) {
  const fecha = new Date().toLocaleDateString('es-SV', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
                      xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
  <meta charset='utf-8'>
  <title>Solicitud de Permiso</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11pt;
      color: #222;
      margin: 2.5cm 2.5cm 2cm 2.5cm;
      line-height: 1.6;
    }
    .header-box {
      display: inline-block;
      background: #F5C400;
      color: #C8102E;
      font-weight: bold;
      font-size: 18pt;
      padding: 4px 14px;
      border-radius: 4px;
      margin-bottom: 18px;
    }
    .date { text-align: right; margin-bottom: 20px; }
    .addressee { margin-bottom: 16px; }
    .addressee strong { display: block; }
    p { text-align: justify; margin-bottom: 12px; }
    .bold-notice { font-weight: bold; text-align: justify; margin-bottom: 12px; }
    .signature { margin-top: 60px; }
    .signature strong { display: block; }
    .footer-bar {
      margin-top: 40px;
      border-top: 3px solid #F5C400;
      padding-top: 6px;
      font-size: 8pt;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header-box">UNIVO</div>

  <div class="date">San Miguel, ${fecha}</div>

  <div class="addressee">
    <strong>${permiso.docente || permiso.aprobadoPor || 'Docente'}</strong>
    Docente de: ${permiso.materia || '__________________'}<br>
    Presente.
  </div>

  <p>
    Reciba a través de la presente un cordial saludo, esperando que se encuentre
    logrando éxitos en sus quehaceres personales y profesionales.
  </p>

  <p>
    ${cuerpoCartaHtml(permiso)}
  </p>

  <p class="bold-notice">
    Cabe mencionar que este tipo de actividades son autorizadas por la RECTORÍA
    de esta Universidad.
  </p>

  <p>
    Esperando poder contar con su permiso y consideración, me despido deseándole
    éxitos en sus labores profesionales.
  </p>

  <div class="signature">
    Atte.<br><br><br>
    <strong>${firmanteNombre(permiso)}</strong>
    ${firmanteUnidad(permiso)}
  </div>

  <div class="footer-bar">
    ☎ 2668-3700 &nbsp;|&nbsp; @univosm &nbsp;|&nbsp; www.univo.edu.sv
  </div>
</body>
</html>`

  saveAs(
    new Blob(['\ufeff', html], { type: 'application/msword' }),
    `Permiso_${permiso.solicitante || 'carta'}_${permiso.fechaInicio || today()}.doc`
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CARTA DE PERMISO — PDF real con jsPDF (se descarga directo a la computadora)
// ─────────────────────────────────────────────────────────────────────────────

export async function exportPermisoPDF(permiso) {
  const { jsPDF } = await import('jspdf')

  const fecha = new Date().toLocaleDateString('es-SV', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  // Tamaño carta en mm
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const PW = 215.9
  const PH = 279.4
  const ML = 25       // margen izquierdo
  const MR = 25       // margen derecho
  const CW = PW - ML - MR  // ancho del contenido = 165.9 mm

  // ── Barra amarilla superior ──────────────────────────────────────────────
  doc.setFillColor(245, 196, 0)
  doc.rect(0, 0, PW, 7, 'F')

  // ── Logo UNIVO: fondo amarillo redondeado + texto rojo ───────────────────
  doc.setFillColor(245, 196, 0)
  doc.roundedRect(ML, 11, 30, 15, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(200, 16, 46)   // rojo UNIVO
  doc.text('UNIVO', ML + 15, 21.5, { align: 'center' })

  // ── Franja amarilla derecha (decorativa) ─────────────────────────────────
  doc.setFillColor(245, 196, 0)
  doc.rect(PW - 6, PH * 0.32, 6, PH * 0.32, 'F')

  // ── Fecha alineada a la derecha ───────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)
  doc.text(`San Miguel, ${fecha}`, PW - MR, 36, { align: 'right' })

  // ── Destinatario ──────────────────────────────────────────────────────────
  let y = 50
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`${permiso.docente || permiso.aprobadoPor || 'Docente'}`, ML, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(`Docente de: ${permiso.materia || '__________________'}`, ML, y)
  y += 6
  doc.text('Presente.', ML, y)
  y += 13

  // ── Helper: párrafo con wrap automático ───────────────────────────────────
  function parrafo(texto, posY, extraGap = 7) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(45, 45, 45)
    const lines = doc.splitTextToSize(texto, CW)
    lines.forEach((line, i) => {
      doc.text(line, ML, posY + i * 5.8)
    })
    return posY + lines.length * 5.8 + extraGap
  }

  // Saludo
  y = parrafo(
    'Reciba a través de la presente un cordial saludo, esperando que se encuentre logrando éxitos en sus quehaceres personales y profesionales.',
    y
  )

  // Cuerpo principal — renderizar nombre del estudiante en negrita
  const { parteAntes: txt1, nombre, parteDespues: txt2 } = cuerpoCartaPDF(permiso)
  const textoFull = txt1 + nombre + txt2
  const lineas = doc.splitTextToSize(textoFull, CW)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(45, 45, 45)

  lineas.forEach((linea, i) => {
    const lineY = y + i * 5.8
    if (nombre && linea.includes(nombre)) {
      const idx = linea.indexOf(nombre)
      // Texto antes del nombre
      if (idx > 0) {
        doc.setFont('helvetica', 'normal')
        doc.text(linea.substring(0, idx), ML, lineY)
      }
      // Nombre en negrita
      const xNombre = ML + doc.getStringUnitWidth(linea.substring(0, idx)) *
        doc.getFontSize() / doc.internal.scaleFactor
      doc.setFont('helvetica', 'bold')
      doc.text(nombre, xNombre, lineY)
      // Resto normal
      const xResto = xNombre + doc.getStringUnitWidth(nombre) *
        doc.getFontSize() / doc.internal.scaleFactor
      doc.setFont('helvetica', 'normal')
      doc.text(linea.substring(idx + nombre.length), xResto, lineY)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.text(linea, ML, lineY)
    }
  })
  y += lineas.length * 5.8 + 7

  // Aviso en negrita
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(40, 40, 40)
  const linesAviso = doc.splitTextToSize(
    'Cabe mencionar que este tipo de actividades son autorizadas por la RECTORÍA de esta Universidad.',
    CW
  )
  linesAviso.forEach((l, i) => doc.text(l, ML, y + i * 5.8))
  y += linesAviso.length * 5.8 + 7

  // Cierre
  y = parrafo(
    'Esperando poder contar con su permiso y consideración, me despido deseándole éxitos en sus labores profesionales.',
    y
  )

  // ── Firma ─────────────────────────────────────────────────────────────────
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(45, 45, 45)
  doc.text('Atte.', ML, y)
  y += 24  // espacio para firma manuscrita

  doc.setFont('helvetica', 'bold')
  doc.text(firmanteNombre(permiso), ML, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(80, 80, 80)
  doc.text(firmanteUnidad(permiso), ML, y)

  // ── Barra amarilla inferior ───────────────────────────────────────────────
  doc.setFillColor(245, 196, 0)
  doc.rect(0, PH - 7, PW, 7, 'F')

  // ── Pie de página ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(110, 110, 110)
  doc.text(
    '\u260E 2668-3700   |   @univosm   |   www.univo.edu.sv',
    PW / 2, PH - 10, { align: 'center' }
  )

  // ── Descargar PDF ─────────────────────────────────────────────────────────
  const nombreArchivo = (permiso.solicitante || 'permiso').replace(/\s+/g, '_')
  doc.save(`Permiso_${nombreArchivo}_${permiso.fechaInicio || today()}.pdf`)
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS ESPECÍFICOS
// ─────────────────────────────────────────────────────────────────────────────

export function exportEstudiantesExcel(est, area) {
  exportToExcel(
    est.map(e => ({
      'Carnet': e.carnet, 'Nombre': e.nombre,
      'Sexo': e.sexo === 'M' ? 'Masculino' : 'Femenino',
      'Área': e.area, 'Carrera': e.carrera || '', 'Año': e.anio || '',
      'Residencia': e.residencia || '', 'Becado': e.becado ? 'Sí' : 'No',
      'Hrs Sociales': e.horasSociales || 0, 'Estado': e.activo ? 'Activo' : 'Inactivo'
    })),
    `Estudiantes_${area || 'General'}_${today()}`,
    'Estudiantes'
  )
}

export function exportAsistenciasExcel(asist, estMap, area, fecha) {
  exportToExcel(
    asist.map(a => {
      const e = estMap[a.estudianteId] || {}
      return {
        'Fecha': a.fecha, 'Carnet': e.carnet || '', 'Nombre': e.nombre || '',
        'Área': a.area, 'Estado': a.estado, 'Notas': a.notas || ''
      }
    }),
    `Asistencias_${area || 'General'}_${fecha || today()}`,
    'Asistencias'
  )
}

export function exportPrestamosExcel(prest, recMap) {
  exportToExcel(
    prest.map(p => {
      const r = recMap[p.recursoId] || {}
      return {
        'Recurso': r.nombre || '', 'Código': r.codigo || '',
        'Estudiante': p.estudianteNombre, 'Carnet': p.estudianteCarnet,
        'Carrera': p.estudianteCarrera || '', 'F.Préstamo': p.fechaPrestamo,
        'F.Devolución': p.fechaDevolucion || 'Pendiente',
        'Est.Salida': p.estadoSalida, 'Est.Regreso': p.estadoDevolucion || '',
        'Entregado': p.entregado ? 'Sí' : 'No'
      }
    }),
    `Prestamos_${today()}`,
    'Préstamos'
  )
}

export function exportPermisosExcel(perm, estMap) {
  exportToExcel(
    perm.map(p => {
      const e = estMap[p.estudianteId] || {}
      return {
        'Estudiante': e.nombre || p.solicitante || '',
        'Área': p.area, 'Tipo': p.tipo,
        'Fecha Inicio': p.fechaInicio, 'Fecha Fin': p.fechaFin,
        'Motivo': p.motivo, 'Estado': p.estado,
        'Aprobado Por': p.aprobadoPor || ''
      }
    }),
    `Permisos_${today()}`,
    'Permisos'
  )
}


// ── Helpers de firma y cuerpo por área ───────────────────────────────────

function getArea(permiso) {
  const a = (permiso.area || '').toLowerCase()
  if (a.includes('danza'))   return 'danza'
  if (a.includes('deporte')) return 'deporte'
  return 'arte y cultura'
}

function firmanteNombre(permiso) {
  if (getArea(permiso) === 'deporte') return 'Pedro Josue Perla Tobar'
  return 'Pedro Josue Perla Tobar'
}

function firmanteUnidad(permiso) {
  const area = getArea(permiso)
  if (area === 'danza')   return 'Encargado de Danza'
  if (area === 'deporte') return 'Encargado de Deporte'
  if (area === 'Arte y Cultura') return 'Encargado de Arte y Cultura'
  return 'Unidad de Arte y Cultura'
}

function cuerpoCartaHtml(permiso) {
  const area    = getArea(permiso)
  const motivo  = permiso.motivo || 'la actividad'
  const est     = permiso.solicitante || ''
  const fi      = permiso.fechaInicio || '___'
  const ff      = permiso.fechaFin    || '___'

  if (area === 'deporte') {
    return `Como Unidad de Deportes de la Universidad de Oriente, tenemos diversas actividades deportivas dentro y fuera de la universidad, tal es el caso del día <strong>${fi}</strong> al <strong>${ff}</strong>, tendremos ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: <strong>${est}</strong>.`
  }
  if (area === 'danza') {
    return `Como Unidad de Danza de la Universidad de Oriente, tenemos diversas expresiones artísticas y culturales, las cuales son solicitadas para ser presentadas en diferentes actividades a nivel nacional e internacional, tal es el caso de ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: <strong>${est}</strong>, quien forma parte de este grupo artístico que representa a nuestra Universidad.`
  }
  if (area === 'arte y cultura') {
    return `Como Unidad de Arte y Cultura de la Universidad de Oriente, tenemos diversas expresiones artísticas y culturales, las cuales son solicitadas para ser presentadas en diferentes actividades sociales y culturales a nivel nacional e internacional, tal es el caso de ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: <strong>${est}</strong>, quien forma parte de este grupo artístico que representa a nuestra Universidad.`
  }

}

function cuerpoCartaPDF(permiso) {
  const area   = getArea(permiso)
  const motivo = permiso.motivo || 'la actividad institucional'
  const nombre = permiso.solicitante || ''
  const fi     = permiso.fechaInicio || '___'
  const ff     = permiso.fechaFin    || '___'

  if (area === 'deporte') {
    return {
      parteAntes:   `Como Unidad de Deportes de la Universidad de Oriente, tenemos diversas actividades deportivas dentro y fuera de la universidad, tal es el caso del día ${fi} al ${ff}, tendremos ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: `,
      nombre,
      parteDespues: '.'
    }
  }
  if (area === 'danza') {
    return {
      parteAntes:   `Como Unidad de Danza de la Universidad de Oriente, tenemos diversas expresiones artísticas y culturales, las cuales son solicitadas para ser presentadas en diferentes actividades a nivel nacional e internacional, tal es el caso de ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: `,
      nombre,
      parteDespues: ', quien forma parte de este grupo artístico que representa a nuestra Universidad.'
    }
  }
  // arte y cultura
  return {
    parteAntes:   `Como Unidad de Arte y Cultura de la Universidad de Oriente, tenemos diversas expresiones artísticas y culturales, las cuales son solicitadas para ser presentadas en diferentes actividades sociales y culturales a nivel nacional e internacional, tal es el caso de ${motivo}; por este motivo solicito le pueda conceder permiso de faltar a los compromisos de su materia al estudiante: `,
    nombre,
    parteDespues: ', quien forma parte de este grupo artístico que representa a nuestra Universidad.'
  }
}

function today() { return new Date().toISOString().split('T')[0] }