import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportToExcel(data, filename, sheetName='Hoja1') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  const maxWidths={}
  data.forEach(row=>Object.entries(row).forEach(([k,v])=>{ const l=Math.max(k.length,String(v??'').length); maxWidths[k]=Math.max(maxWidths[k]||0,l) }))
  ws['!cols']=Object.values(maxWidths).map(w=>({wch:Math.min(w+2,40)}))
  XLSX.utils.book_append_sheet(wb,ws,sheetName)
  const buf=XLSX.write(wb,{bookType:'xlsx',type:'array'})
  saveAs(new Blob([buf],{type:'application/octet-stream'}),`${filename}.xlsx`)
}

export function exportToWord(title, headers, rows, filename) {
  const tableRows=rows.map(row=>`<tr>${row.map(cell=>`<td style="padding:6px 10px;border:1px solid #ddd;font-size:11pt;">${cell??''}</td>`).join('')}</tr>`).join('')
  const html=`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset='utf-8'><title>${title}</title>
<style>body{font-family:Calibri,Arial,sans-serif;margin:2cm;color:#1a1a2e}h1{font-size:16pt;color:#1a1a2e;margin-bottom:4px}.sub{font-size:10pt;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;margin-top:12px}th{background:#1a1a2e;color:white;padding:7px 10px;font-size:10pt;text-align:left;border:1px solid #1a1a2e}tr:nth-child(even) td{background:#f5f5f8}.footer{margin-top:24px;font-size:9pt;color:#999;border-top:1px solid #eee;padding-top:8px}</style>
</head><body>
<h1>Universidad de Oriente — UNIVO</h1>
<div class='sub'>${title} | Generado: ${new Date().toLocaleDateString('es-SV',{dateStyle:'full'})}</div>
<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table>
<div class='footer'>Sistema de Gestión ACyD — UNIVO © ${new Date().getFullYear()}</div>
</body></html>`
  saveAs(new Blob(['\ufeff',html],{type:'application/msword'}),`${filename}.doc`)
}

// Helpers específicos
export function exportEstudiantesExcel(est, area) {
  exportToExcel(est.map(e=>({'Carnet':e.carnet,'Nombre':e.nombre,'Sexo':e.sexo==='M'?'Masculino':'Femenino','Área':e.area,'Carrera':e.carrera||'','Año':e.anio||'','Residencia':e.residencia||'','Becado':e.becado?'Sí':'No','Hrs Sociales':e.horasSociales||0,'Estado':e.activo?'Activo':'Inactivo'})), `Estudiantes_${area||'General'}_${today()}`, 'Estudiantes')
}
export function exportAsistenciasExcel(asist, estMap, area, fecha) {
  exportToExcel(asist.map(a=>{ const e=estMap[a.estudianteId]||{}; return {'Fecha':a.fecha,'Carnet':e.carnet||'','Nombre':e.nombre||'','Área':a.area,'Estado':a.estado,'Notas':a.notas||''} }), `Asistencias_${area||'General'}_${fecha||today()}`, 'Asistencias')
}
export function exportPrestamosExcel(prest, recMap) {
  exportToExcel(prest.map(p=>{ const r=recMap[p.recursoId]||{}; return {'Recurso':r.nombre||'','Código':r.codigo||'','Estudiante':p.estudianteNombre,'Carnet':p.estudianteCarnet,'Carrera':p.estudianteCarrera||'','F.Préstamo':p.fechaPrestamo,'F.Devolución':p.fechaDevolucion||'Pendiente','Est.Salida':p.estadoSalida,'Est.Regreso':p.estadoDevolucion||'','Entregado':p.entregado?'Sí':'No'} }), `Prestamos_${today()}`, 'Préstamos')
}
export function exportPermisosExcel(perm, estMap) {
  exportToExcel(perm.map(p=>{ const e=estMap[p.estudianteId]||{}; return {'Estudiante':e.nombre||p.solicitante||'','Área':p.area,'Tipo':p.tipo,'Fecha Inicio':p.fechaInicio,'Fecha Fin':p.fechaFin,'Motivo':p.motivo,'Estado':p.estado,'Aprobado Por':p.aprobadoPor||''} }), `Permisos_${today()}`, 'Permisos')
}

function today() { return new Date().toISOString().split('T')[0] }