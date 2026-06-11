import * as XLSX from 'xlsx';
import { PqrsRecord, SheetAudit } from '../types';
import { CARRIERS, REASONS_MAP, ACTIONS_MAP } from '../data/mockData';

// Attempt to map a generic row from Excel into our PqrsRecord interface
export function mapRawRowToPqrs(row: any, index: number): PqrsRecord {
  // Try common keys in Spanish and English
  const getVal = (keys: string[]): any => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== null) return row[k];
      // Try case-insensitive and loose match
      const foundKey = Object.keys(row).find(
        (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
      );
      if (foundKey) return row[foundKey];
    }
    return null;
  };

  // Extract ID using Column A (first key of row)
  const keys = Object.keys(row);
  const colAKey = keys[0];
  let id = colAKey ? String(row[colAKey]).trim() : '';

  if (!id) {
    id = getVal(['radicado', 'radicados', 'id', 'pqrs', 'consecutivo', 'codigo', 'numero', 'num', 'nro radicado']);
  }
  if (!id) {
    id = `2606101${String(100000 + index)}`;
  }

  // Extract Date
  let fechaRaw = getVal(['fecha', 'fecha y hora de radicado', 'fecha de radicado', 'fecha de marcado', 'date', 'momento', 'dia']);
  let fecha = '';
  if (fechaRaw) {
    if (typeof fechaRaw === 'number') {
      // Excel serial date number
      try {
        const dateObj = XLSX.SSF.parse_date_code(fechaRaw);
        fecha = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      } catch (e) {
        fecha = new Date().toISOString().split('T')[0];
      }
    } else {
      try {
        const d = new Date(fechaRaw);
        if (!isNaN(d.getTime())) {
          fecha = d.toISOString().split('T')[0];
        } else {
          fecha = String(fechaRaw).split(' ')[0] || new Date().toISOString().split('T')[0];
        }
      } catch {
        fecha = new Date().toISOString().split('T')[0];
      }
    }
  } else {
    fecha = new Date().toISOString().split('T')[0];
  }

  // Extract Carrier (Transportadora)
  let transportadoraRaw = String(getVal(['transportadora', 'carrier', 'empresa', 'envio', 'transportador', 'nombre transportadora', 'empresa_transporte', 'proveedor']) || '').trim();
  let transportadora = transportadoraRaw || 'Sin Transportador';

  // Extract Reason (Motivo)
  let motivoRaw = String(getVal(['motivo', 'reason', 'causa', 'descripcionmotivo', 'reclamo', 'tipo']) || '');
  let motivo = REASONS_MAP.NOVEDADES_ENTREGA; // default
  
  // Try to find best match from REASONS_MAP
  const matchedReasonKey = Object.keys(REASONS_MAP).find(k => {
    const rVal = REASONS_MAP[k as keyof typeof REASONS_MAP].toLowerCase();
    return motivoRaw.toLowerCase().includes(rVal) || rVal.includes(motivoRaw.toLowerCase());
  });
  if (matchedReasonKey) {
    motivo = REASONS_MAP[matchedReasonKey as keyof typeof REASONS_MAP];
  } else if (motivoRaw) {
    motivo = motivoRaw; // Keep raw if not matching pre-known ones
  }

  // Extract Action (Acción)
  let accionRaw = '';
  if (row['_colADValue'] !== undefined && row['_colADValue'] !== null && String(row['_colADValue']).trim() !== '') {
    accionRaw = String(row['_colADValue']).trim();
  } else {
    accionRaw = String(getVal(['accion', 'action', 'plan', 'planaccion', 'resolucion', 'solucion']) || '');
  }
  let accion = ACTIONS_MAP.LLAMADO_ATENCION; // default
  
  const matchedActionKey = Object.keys(ACTIONS_MAP).find(k => {
    const aVal = ACTIONS_MAP[k as keyof typeof ACTIONS_MAP].toLowerCase();
    return accionRaw.toLowerCase().includes(aVal) || aVal.includes(accionRaw.toLowerCase());
  });
  if (matchedActionKey) {
    accion = ACTIONS_MAP[matchedActionKey as keyof typeof ACTIONS_MAP];
  } else if (accionRaw) {
    accion = accionRaw;
  }

  // Extract Tipo Requerimiento (Column R / index 17)
  let tipoRequerimiento = '';
  if (row['_colRValue'] !== undefined && row['_colRValue'] !== null && String(row['_colRValue']).trim() !== '') {
    tipoRequerimiento = String(row['_colRValue']).trim();
  } else {
    tipoRequerimiento = String(getVal(['tipo_requerimiento', 'categoría', 'categoria', 'tipo de requerimiento', 'tipo requerimiento', 'clase']) || (index % 2 === 0 ? 'Reclamo' : 'Queja'));
  }

  // Extract Column S (index 18) "ESTADO NPS" value. If diligenced, category is 'NPS'
  let colTValue = 'PQRS';
  let colSValue = '';
  if (row['_colSValue'] !== undefined && row['_colSValue'] !== null && String(row['_colSValue']).trim() !== '') {
    colSValue = String(row['_colSValue']).trim();
    colTValue = 'NPS';
  } else if (row['colSValue'] !== undefined && row['colSValue'] !== null && String(row['colSValue']).trim() !== '') {
    colSValue = String(row['colSValue']).trim();
    colTValue = 'NPS';
  } else if (row['estadoNps'] !== undefined && row['estadoNps'] !== null && String(row['estadoNps']).trim() !== '') {
    colSValue = String(row['estadoNps']).trim();
    colTValue = 'NPS';
  } else {
    colTValue = 'PQRS';
  }

  // Extract Status (Estado)
  let estadoRaw = String(getVal(['estado', 'status', 'fase']) || 'Cerrado');
  let estado: 'Abierto' | 'Cerrado' | 'En proceso' = 'Cerrado';
  if (estadoRaw.toLowerCase().includes('abier') || estadoRaw.toLowerCase().includes('open')) {
    estado = 'Abierto';
  } else if (estadoRaw.toLowerCase().includes('proc') || estadoRaw.toLowerCase().includes('tram') || estadoRaw.toLowerCase().includes('pend')) {
    estado = 'En proceso';
  }

  // Extract numeric attributes
  let costoMercanciaRaw = getVal(['costomercancia', 'valor', 'precio', 'costo', 'declarado', 'monto']);
  let costoMercancia = typeof costoMercanciaRaw === 'number' ? costoMercanciaRaw : parseFloat(String(costoMercanciaRaw || '').replace(/[^0-9.-]+/g, '')) || 0;

  let diasDemoraRaw = getVal(['diasdemora', 'dias', 'demora', 'retraso', 'tiempo']);
  let diasDemora = typeof diasDemoraRaw === 'number' ? diasDemoraRaw : parseInt(String(diasDemoraRaw || '').replace(/[^0-9-]+/g, '')) || 0;

  // Estimate a realistic penalty cost if none exists in the sheet
  let costoPenalizacionRaw = getVal(['costopenalizacion', 'penalizacion', 'multa', 'descuento']);
  let costoPenalizacion = 0;
  if (costoPenalizacionRaw !== null && costoPenalizacionRaw !== undefined) {
    costoPenalizacion = typeof costoPenalizacionRaw === 'number' ? costoPenalizacionRaw : parseFloat(String(costoPenalizacionRaw).replace(/[^0-9.-]+/g, '')) || 0;
  } else {
    // default penalty algorithm
    if (accion === ACTIONS_MAP.COBRO_TRANSPORTADOR) {
      costoPenalizacion = costoMercancia > 0 ? costoMercancia : 85000;
    } else if (accion === ACTIONS_MAP.LLAMADO_ATENCION) {
      costoPenalizacion = diasDemora > 0 ? diasDemora * 15000 : 0;
    } else if (accion === ACTIONS_MAP.SUSPENSION) {
      costoPenalizacion = 250000;
    }
  }

  // Guia
  let guia = String(getVal(['guia', 'tracking', 'guianumber', 'envio_id', 'factura', 'factura / pedido', 'pedido']) || `COL-${Math.floor(Math.random() * 89999 + 10000)}`);

  // Cliente
  let cliente = String(getVal(['cliente', 'destinatario', 'user', 'nombre', 'customer', 'usuario solicitante']) || 'Cliente Anónimo');

  // Descripcion
  let descripcion = String(getVal(['descripcion', 'detalle', 'observacion', 'comentario', 'notas', 'investigacion', 'investigación']) || `PQRS reportado por el cliente por motivo de ${motivo}.`);

  // Extract high fidelity regional and operational fields
  let region = String(getVal(['region', 'región', 'regional', 'territorial']) || '').trim();
  let subRegion = String(getVal(['subregion', 'sub región', 'subregional', 'ciudad', 'sub_region']) || '').trim();
  let zona = String(getVal(['zona', 'zone', 'cobertura']) || '').trim();
  let canal = String(getVal(['canal', 'channel']) || '').trim();
  let cedi = String(getVal(['cedi', 'cedicxd', 'cedi-cxd', 'centrodistribucion', 'origen', 'cedi - cxd']) || '').trim();
  let placa = String(getVal(['placa', 'placas', 'vehiculo', 'id_vehiculo', 'patente']) || '').trim();
  let causaRaizSubtema = String(getVal(['causaraizsubtema', 'causa raíz subtema', 'subtema', 'causa_raiz_subtema']) || '').trim();
  let nivelCumplimiento = String(getVal(['niveldecumplimiento', 'nivel de cumplimiento', 'cumplimiento', 'nivel_cumplimiento']) || '').trim();
  let estadoGestion = String(getVal(['estadogestion', 'estado gestión', 'estado_gestión', 'estado gestion']) || '').trim();
  let mes = String(getVal(['mes', 'month', 'periodo']) || '').trim().toUpperCase();
  if (!mes && fecha) {
    const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    try {
      const monthIdx = new Date(fecha).getMonth();
      if (!isNaN(monthIdx)) {
        mes = months[monthIdx];
      }
    } catch {}
  }
  
  let diasTransRaw = getVal(['diastranscurridos', 'días transcurridos', 'transcurridos', 'dias_transcurridos']);
  let diasTranscurridos = typeof diasTransRaw === 'number' ? diasTransRaw : parseInt(String(diasTransRaw || '').replace(/[^0-9-]+/g, '')) || 0;

  // Extract N (cantidad de radicados) - Count column A as 1 unit
  let cantidad = 1;

  // Extract Responsable
  let responsableRaw = String(getVal(['responsable', 'asignado', 'encargado', 'agent', 'analista', 'responsables', 'user_sac']) || '').trim();
  const SAC_AGENTS = ['Carlos Alberto Ruíz', 'Laura Camila Ospina', 'Juan David Gómez', 'Diana Marcela Torres', 'Soporte SAC CEDI'];
  let responsable = responsableRaw || SAC_AGENTS[index % SAC_AGENTS.length];

  // If we have diasTranscurridos, align diasDemora with it
  if (diasTranscurridos > 0 && diasDemora === 0) {
    diasDemora = diasTranscurridos;
  }

  return {
    id: String(id),
    fecha,
    transportadora,
    motivo,
    accion,
    estado,
    costoMercancia,
    diasDemora,
    costoPenalizacion,
    guia,
    cliente,
    descripcion,
    region: region || undefined,
    subRegion: subRegion || undefined,
    zona: zona || undefined,
    canal: canal || undefined,
    cedi: cedi || undefined,
    placa: placa || undefined,
    causaRaizSubtema: causaRaizSubtema || undefined,
    nivelCumplimiento: nivelCumplimiento || undefined,
    estadoGestion: estadoGestion || undefined,
    mes: mes || undefined,
    tipoRequerimiento: tipoRequerimiento || undefined,
    colTValue: colTValue || undefined,
    colSValue: colSValue || undefined,
    diasTranscurridos: diasTranscurridos || undefined,
    cantidad: cantidad,
    responsable: responsable,
    rawData: row
  };
}

// Calculate detailed Excel sheet audit across all rows
export function calculateSheetAudit(worksheet: XLSX.WorkSheet, sheetName: string): SheetAudit {
  // First convert worksheet to object array to support your exact formula
  const datos = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
  
  // EXACT FORMULA REQUESTED BY THE USER:
  // ONLY count diligenced radicados
  const totalPQRS = datos.filter(
    r => r["RADICADO"] && String(r["RADICADO"]).trim() !== ""
  ).length;

  const keys = Object.keys(datos[0] || {});
  const firstKey = keys[0] || 'RADICADO';
  const radKey = keys.includes('RADICADO') ? 'RADICADO' : firstKey;

  const resolvedTotalRadicados = datos.filter(r => r[radKey] && String(r[radKey]).trim() !== "").length;

  const unicosSet = new Set<string>();
  datos.forEach(r => {
    const val = r[radKey];
    if (val && String(val).trim() !== "") {
      unicosSet.add(String(val).trim());
    }
  });

  let totalNps = 0;
  let totalPqrs = 0;

  datos.forEach((r, idx) => {
    const valRad = r[radKey];
    if (valRad !== undefined && valRad !== null && String(valRad).trim() !== "") {
      const rowKeys = Object.keys(r);
      // Column S is index 18 (representing "ESTADO NPS")
      let colSValueRaw = rowKeys[18] !== undefined ? r[rowKeys[18]] : null;
      const matchedSKey = rowKeys.find(k => {
        const kLow = k.toLowerCase();
        return kLow === 'columna s' || kLow === 's' || kLow.includes('estado nps') || kLow.includes('estadonps');
      });
      if (matchedSKey) {
        colSValueRaw = r[matchedSKey];
      }
      
      const isSFilled = colSValueRaw !== undefined && colSValueRaw !== null && String(colSValueRaw).trim() !== '';
      if (isSFilled) {
        totalNps++;
      } else {
        totalPqrs++;
      }
    }
  });

  const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
  let filasSinRadicado = 0;

  if (rows.length > 0) {
    let headerRowIndex = 0;
    let headers: string[] = [];

    for (let r = 0; r < Math.min(6, rows.length); r++) {
      const rowCells = rows[r] || [];
      const hasRadicadoHeader = rowCells.some(cell => {
        const s = String(cell).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        return s.includes('radicado') || s === 'id' || s === 'pqrs' || s === 'consecutivo';
      });
      if (hasRadicadoHeader) {
        headerRowIndex = r;
        headers = rowCells.map(h => String(h).trim().toLowerCase());
        break;
      }
    }

    if (headers.length === 0) {
      headers = (rows[0] || []).map(h => String(h).trim().toLowerCase());
      headerRowIndex = 0;
    }

    let radicadoColIdx = -1;
    const radicadoPossibleNames = ['radicado', 'radicados', 'nroradicado', 'nro radicado', 'consecutivo', 'id', 'pqrs', 'codigo', 'numero', 'num'];
    for (const name of radicadoPossibleNames) {
      radicadoColIdx = headers.findIndex(h => h.replace(/[^a-z0-9]/g, '') === name.replace(/[^a-z0-9]/g, ''));
      if (radicadoColIdx !== -1) break;
    }

    if (radicadoColIdx === -1) {
      radicadoColIdx = headers.findIndex(h => h.includes('radicado'));
    }

    if (radicadoColIdx === -1) {
      radicadoColIdx = 0;
    }

    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const rawRow = rows[r];
      if (!rawRow || rawRow.length === 0) continue;

      const isCompletelyEmpty = rawRow.every(cell => {
        if (cell === null || cell === undefined) return true;
        if (typeof cell === 'string' && cell.trim() === '') return true;
        return false;
      });

      if (isCompletelyEmpty) continue;

      const radComponent = rawRow[radicadoColIdx];
      const hasRadVal = radComponent !== undefined && radComponent !== null && String(radComponent).trim() !== '';

      if (!hasRadVal) {
        filasSinRadicado++;
      }
    }
  }

  return {
    totalRadicados: resolvedTotalRadicados,
    unicosRadicados: unicosSet.size,
    filasSinRadicado,
    sheetNameUsed: sheetName,
    totalNps,
    totalPqrs
  };
}

// Calculate detailed CSV audit across all rows
export function calculateCsvAudit(text: string): SheetAudit {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) {
    return { totalRadicados: 0, unicosRadicados: 0, filasSinRadicado: 0, sheetNameUsed: 'CSV Archivo' };
  }

  const delimiter = text.includes(';') ? ';' : ',';
  const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const headers = rawHeaders.map(h => h.toLowerCase());

  // Parse lines to raw objects for exact formula matching
  const datos: any[] = [];
  let filasSinRadicado = 0;

  // Find RADICADO column index
  const radicadoPossibleNames = ['radicado', 'radicados', 'nroradicado', 'nro radicado', 'consecutivo', 'id', 'pqrs', 'codigo', 'numero', 'num'];
  let radicadoColIdx = -1;
  for (const name of radicadoPossibleNames) {
    radicadoColIdx = headers.findIndex(h => h.replace(/[^a-z0-9]/g, '') === name.replace(/[^a-z0-9]/g, ''));
    if (radicadoColIdx !== -1) break;
  }

  if (radicadoColIdx === -1) {
    radicadoColIdx = headers.findIndex(h => h.includes('radicado'));
  }

  if (radicadoColIdx === -1) {
    radicadoColIdx = 0;
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split with quote awareness
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const isCompletelyEmpty = values.every(v => v === '');
    if (isCompletelyEmpty) {
      continue; // Ignorar únicamente las filas completamente vacías
    }

    const rowObj: any = {};
    rawHeaders.forEach((rawH, idx) => {
      rowObj[rawH] = values[idx] !== undefined ? values[idx] : '';
    });
    datos.push(rowObj);

    const radVal = values[radicadoColIdx];
    const hasRadVal = radVal !== undefined && radVal !== null && radVal.trim() !== '';
    if (!hasRadVal) {
      filasSinRadicado++;
    }
  }

  // EXACT FORMULA REQUESTED BY THE USER:
  const firstKey = rawHeaders[0] || 'RADICADO';
  const radKey = rawHeaders.includes('RADICADO') ? 'RADICADO' : firstKey;

  const resolvedTotalRadicados = datos.filter(r => r[radKey] && String(r[radKey]).trim() !== "").length;

  const unicosSet = new Set<string>();
  datos.forEach(r => {
    const val = r[radKey];
    if (val && String(val).trim() !== "") {
      unicosSet.add(String(val).trim());
    }
  });

  let totalNps = 0;
  let totalPqrs = 0;

  datos.forEach((r, idx) => {
    const valRad = r[radKey];
    if (valRad !== undefined && valRad !== null && String(valRad).trim() !== "") {
      const rowKeys = Object.keys(r);
      // Column S is index 18 (representing "ESTADO NPS")
      let colSValueRaw = rowKeys[18] !== undefined ? r[rowKeys[18]] : null;
      const matchedSKey = rowKeys.find(k => {
        const kLow = k.toLowerCase();
        return kLow === 'columna s' || kLow === 's' || kLow.includes('estado nps') || kLow.includes('estadonps');
      });
      if (matchedSKey) {
        colSValueRaw = r[matchedSKey];
      }
      
      const isSFilled = colSValueRaw !== undefined && colSValueRaw !== null && String(colSValueRaw).trim() !== '';
      if (isSFilled) {
        totalNps++;
      } else {
        totalPqrs++;
      }
    }
  });

  return {
    totalRadicados: resolvedTotalRadicados,
    unicosRadicados: unicosSet.size,
    filasSinRadicado,
    sheetNameUsed: 'CSV Archivo',
    totalNps,
    totalPqrs
  };
}

// Read sheet from ArrayBuffer
export function parseSheetBuffer(buffer: ArrayBuffer): PqrsRecord[] {
  const data = new Uint8Array(buffer);
  const workbook = XLSX.read(data, { type: 'array' });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return [];
  }

  // Find a sheet whose name is "GENERAL" (case-insensitive) or contains "GENERAL"
  let sheetName = workbook.SheetNames.find(
    (name) => name.trim().toUpperCase() === 'GENERAL'
  );

  if (!sheetName) {
    sheetName = workbook.SheetNames.find(
      (name) => name.toUpperCase().includes('GENERAL')
    );
  }

  // Fallback to the first sheet if no general sheet exists
  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return [];

  let colADHeader = '';
  let colRHeader = '';
  let colTHeader = '';
  let colSHeader = '';
  try {
    const ref = worksheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      const startRow = range.s.r;
      let headersRowIdx = startRow;
      for (let r = range.s.r; r <= Math.min(range.s.r + 5, range.e.r); r++) {
        const rowCells: any[] = [];
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = worksheet[XLSX.utils.encode_cell({ r, c })];
          rowCells.push(cell ? String(cell.v).trim().toLowerCase() : '');
        }
        if (rowCells.some(cell => cell.includes('radicado') || cell === 'id' || cell === 'pqrs' || cell === 'consecutivo')) {
          headersRowIdx = r;
          break;
        }
      }

      const adCell = worksheet[XLSX.utils.encode_cell({ r: headersRowIdx, c: 29 })];
      if (adCell && adCell.v) {
        colADHeader = String(adCell.v).trim();
      }
      const rCell = worksheet[XLSX.utils.encode_cell({ r: headersRowIdx, c: 17 })];
      if (rCell && rCell.v) {
        colRHeader = String(rCell.v).trim();
      }
      const tCell = worksheet[XLSX.utils.encode_cell({ r: headersRowIdx, c: 19 })];
      if (tCell && tCell.v) {
        colTHeader = String(tCell.v).trim();
      }
      const sCell = worksheet[XLSX.utils.encode_cell({ r: headersRowIdx, c: 18 })];
      if (sCell && sCell.v) {
        colSHeader = String(sCell.v).trim();
      }
    }
  } catch (err) {
    console.error("Error finding custom column headers:", err);
  }

  // Convert worksheet to JSON
  const json = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });
  
  // Filter out any row where Column A (the first key of the row object) is empty (meaning not diligenced)
  const validJson = json.filter((row: any) => {
    const keys = Object.keys(row);
    if (keys.length === 0) return false;
    const colAKey = keys[0];
    const val = row[colAKey];
    return val !== undefined && val !== null && String(val).trim() !== "";
  });
  
  // Also calculate and persist sheet audit
  try {
    const audit = calculateSheetAudit(worksheet, sheetName);
    localStorage.setItem('pqrs_excel_audit', JSON.stringify(audit));
  } catch (err) {
    console.error('Error calculating sheet audit', err);
  }
  
  return validJson.map((row: any, i) => {
    if (colADHeader && row[colADHeader] !== undefined) {
      row['_colADValue'] = row[colADHeader];
    }
    if (colRHeader && row[colRHeader] !== undefined) {
      row['_colRValue'] = row[colRHeader];
    }
    if (colTHeader && row[colTHeader] !== undefined) {
      row['_colTValue'] = row[colTHeader];
    }
    if (colSHeader && row[colSHeader] !== undefined) {
      row['_colSValue'] = row[colSHeader];
    }
    const keys = Object.keys(row);
    if (!row['_colADValue'] && keys[29] !== undefined) {
      row['_colADValue'] = row[keys[29]];
    }
    if (!row['_colRValue'] && keys[17] !== undefined) {
      row['_colRValue'] = row[keys[17]];
    }
    if (!row['_colTValue'] && keys[19] !== undefined) {
      row['_colTValue'] = row[keys[19]];
    }
    if (!row['_colSValue'] && keys[18] !== undefined) {
      row['_colSValue'] = row[keys[18]];
    }
    return mapRawRowToPqrs(row, i);
  });
}

// Simple parsing from a CSV text
export function parseCsvText(text: string): PqrsRecord[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Naive CSV parser (supporting standard commas or semicolons)
  const delimiter = text.includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));

  // Also calculate and persist CSV audit
  try {
    const audit = calculateCsvAudit(text);
    localStorage.setItem('pqrs_excel_audit', JSON.stringify(audit));
  } catch (err) {
    console.error('Error calculating CSV audit', err);
  }

  const colADHeader = headers[29] || '';
  const colRHeader = headers[17] || '';
  const colTHeader = headers[19] || '';
  const colSHeader = headers[18] || '';

  const rows: PqrsRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse respecting nested quotes can be tricky, but let's do a fast split
    // that handles standard quotes
    const values: string[] = [];
    let insideQuote = false;
    let currentVal = '';

    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const char = line[charIdx];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === delimiter && !insideQuote) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    // Create a row object
    const rowObj: any = {};
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx] !== undefined ? values[idx] : '';
    });

    if (colADHeader && rowObj[colADHeader] !== undefined) {
      rowObj['_colADValue'] = rowObj[colADHeader];
    }
    if (colRHeader && rowObj[colRHeader] !== undefined) {
      rowObj['_colRValue'] = rowObj[colRHeader];
    }
    if (colTHeader && rowObj[colTHeader] !== undefined) {
      rowObj['_colTValue'] = rowObj[colTHeader];
    }
    if (colSHeader && rowObj[colSHeader] !== undefined) {
      rowObj['_colSValue'] = rowObj[colSHeader];
    }
    const keys = Object.keys(rowObj);
    if (!rowObj['_colADValue'] && keys[29] !== undefined) {
      rowObj['_colADValue'] = rowObj[keys[29]];
    }
    if (!rowObj['_colRValue'] && keys[17] !== undefined) {
      rowObj['_colRValue'] = rowObj[keys[17]];
    }
    if (!rowObj['_colTValue'] && keys[19] !== undefined) {
      rowObj['_colTValue'] = rowObj[keys[19]];
    }
    if (!rowObj['_colSValue'] && keys[18] !== undefined) {
      rowObj['_colSValue'] = rowObj[keys[18]];
    }

    // Check if Column A (first header) value is diligenced (not empty/whitespace)
    const firstKey = headers[0];
    const colAVal = firstKey ? rowObj[firstKey] : '';
    if (colAVal !== undefined && colAVal !== null && String(colAVal).trim() !== "") {
      rows.push(mapRawRowToPqrs(rowObj, rows.length));
    }
  }

  return rows;
}
