import { PqrsRecord, RuleConfig } from '../types';

// Exact action names as per screenshot
export const ACTIONS_MAP = {
  LLAMADO_ATENCION: 'Llamado de Atencion',
  COBRO_TRANSPORTADOR: 'Cobro al Transportador',
  NO_APLICA: 'No Aplica',
  REINDUCCION: 'Reinducción',
  CAPACITACION: 'Capacitacion de Procesos',
  GESTION_SAC: 'Gestion Interna SAC',
  SUSPENSION: 'suspension'
};

// Exact reasons as per screenshot
export const REASONS_MAP = {
  NOVEDADES_ENTREGA: 'Novedades en la entrega',
  ATENCION_FUNCIONARIO: 'Atención del funcionario',
  DEMORA_ENTREGA: 'Demora en la entrega de mercancía',
  ATENCION_SERVICIO: 'Atención y Servicio al Cliente',
  MANIPULACION: 'Manipulación deficiente en cargue',
  DANO_PERDIDA: 'Daño o pérdidas en trayecto',
  AVERIA_PRODUCTO: 'Averia producto no conforme',
  INCUMPLIMIENTO_FRANJA_PACTADA: 'Incumplimiento en franja pactada',
  ENTREGA_PARCIAL: 'Entrega parcial',
  INCUMPLIMIENTO_FRANJA_HORARIA: 'Incumplimiento franja horaria'
};

export const INITIAL_RULES: RuleConfig[] = [
  {
    motivo: REASONS_MAP.NOVEDADES_ENTREGA,
    accion: ACTIONS_MAP.LLAMADO_ATENCION,
    porcentajeCobro: 0,
    tarifaBase: 5,
    multaPorDia: 0,
    strikes: 1,
    resolucionSLA: 3
  },
  {
    motivo: REASONS_MAP.DANO_PERDIDA,
    accion: ACTIONS_MAP.COBRO_TRANSPORTADOR,
    porcentajeCobro: 100,
    tarifaBase: 50,
    multaPorDia: 0,
    strikes: 3,
    resolucionSLA: 5
  },
  {
    motivo: REASONS_MAP.AVERIA_PRODUCTO,
    accion: ACTIONS_MAP.COBRO_TRANSPORTADOR,
    porcentajeCobro: 80,
    tarifaBase: 30,
    multaPorDia: 0,
    strikes: 2,
    resolucionSLA: 5
  },
  {
    motivo: REASONS_MAP.DEMORA_ENTREGA,
    accion: ACTIONS_MAP.COBRO_TRANSPORTADOR,
    porcentajeCobro: 0,
    tarifaBase: 15,
    multaPorDia: 10,
    strikes: 1,
    resolucionSLA: 2
  },
  {
    motivo: REASONS_MAP.ATENCION_FUNCIONARIO,
    accion: ACTIONS_MAP.REINDUCCION,
    porcentajeCobro: 0,
    tarifaBase: 0,
    multaPorDia: 0,
    strikes: 2,
    resolucionSLA: 4
  },
  {
    motivo: REASONS_MAP.MANIPULACION,
    accion: ACTIONS_MAP.CAPACITACION,
    porcentajeCobro: 20,
    tarifaBase: 15,
    multaPorDia: 0,
    strikes: 1.5,
    resolucionSLA: 4
  },
  {
    motivo: REASONS_MAP.ENTREGA_PARCIAL,
    accion: ACTIONS_MAP.GESTION_SAC,
    porcentajeCobro: 0,
    tarifaBase: 0,
    multaPorDia: 0,
    strikes: 0.5,
    resolucionSLA: 2
  },
  {
    motivo: REASONS_MAP.INCUMPLIMIENTO_FRANJA_HORARIA,
    accion: ACTIONS_MAP.SUSPENSION,
    porcentajeCobro: 0,
    tarifaBase: 100,
    multaPorDia: 20,
    strikes: 5,
    resolucionSLA: 1
  }
];

export const CARRIERS = [
  'Servientrega',
  'Envía Colvanes',
  'Interrapidísimo',
  'Coordinadora',
  'TCC Cargo',
  'Deprisa'
];

const CLIENTES = [
  'Juan Carlos Gomez', 'Marta Lucía Restrepo', 'Andrés Felipe Diaz',
  'Diana Sofia Ortiz', 'Camilo Torres', 'Patricia Caicedo',
  'Gustavo Petro Urrego', 'Alvaro Uribe V.', 'Liliana Marcela Perez',
  'Enrique Peñalosa', 'Sofia Vergara', 'James Rodriguez'
];

const DESCRIPCIONES: Record<string, string[]> = {
  [REASONS_MAP.NOVEDADES_ENTREGA]: [
    'El destinatario no se encontraba en la dirección suministrada.',
    'Dirección errónea reportada por el transportador en planilla de despacho.',
    'Rehusó recibir indicando que no realizó el pedido.',
    'Se reportó zona de difícil acceso o zona roja de seguridad.'
  ],
  [REASONS_MAP.ATENCION_FUNCIONARIO]: [
    'Mensajero grosero y desatento al entregar el paquete.',
    'Falta de amabilidad del operador administrativo de la transportadora.',
    'El conductor se negó a subir el paquete hasta el tercer piso.',
    'Mal trato verbal al cliente final durante la entrega.'
  ],
  [REASONS_MAP.DEMORA_ENTREGA]: [
    'Retraso de más de 5 días hábiles en la entrega del paquete.',
    'El paquete estuvo retenido en bodega local sin justificación.',
    'Demora por aparente falla mecánica del vehículo repartidor.',
    'Paquete reprogramado tres veces por fuera del tiempo límite.'
  ],
  [REASONS_MAP.ATENCION_SERVICIO]: [
    'No dan respuesta a la solicitud de rastreo telefónico.',
    'El portal web de reenvío se encuentra inoperable.',
    'Atención deficiente en la oficina radicadora.'
  ],
  [REASONS_MAP.MANIPULACION]: [
    'Caja golpeada y mojada por mal estibaje en el camión.',
    'Arrastre del paquete sobre superficie húmeda de la bodega.',
    'La caja de cartón llegó abierta lateralmente.'
  ],
  [REASONS_MAP.DANO_PERDIDA]: [
    'Pérdida total del envío en tránsito certificado por la transportadora.',
    'Daño estructural permanente del equipo enviado.',
    'Mercancía rota y declarada en pérdida.'
  ],
  [REASONS_MAP.AVERIA_PRODUCTO]: [
    'Avería menor del empaque que afectó el producto.',
    'El empaque presentaba abolladuras pero el producto funciona parcialmente.',
    'Producto rayado por fricción.'
  ],
  [REASONS_MAP.INCUMPLIMIENTO_FRANJA_PACTADA]: [
    'Se solicitó franja mañana (8 AM - 12 PM) y se entregó a las 5 PM.',
    'No cumplieron el horario de entrega programada corporativa.'
  ],
  [REASONS_MAP.ENTREGA_PARCIAL]: [
    'Faltó una caja de las tres correspondientes a la guía de despacho.',
    'Se entregó el producto principal pero faltaron los accesorios.'
  ],
  [REASONS_MAP.INCUMPLIMIENTO_FRANJA_HORARIA]: [
    'Se entregó por fuera de la jornada laboral habitual autorizada (9 PM).'
  ]
};

// Returns a random array element
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export function generateSampleData(): PqrsRecord[] {
  const records: PqrsRecord[] = [];
  const now = new Date();

  // Mock regional and operational pools based on user spreadsheets
  const REGIONS_MOCK = ['Antioquia', 'Centro', 'Occidente', 'Costa', 'Eje Cafetero', 'BOGOTA'];
  const SUBREGIONS_MOCK: Record<string, string[]> = {
    'Antioquia': ['Medellin', 'Bello', 'Rionegro'],
    'Centro': ['Bogota Norte', 'Bogota Sur', 'Villavicencio'],
    'Occidente': ['Cali', 'Palmira', 'Buga'],
    'Costa': ['Cartagena', 'Valledupar', 'Barranquilla'],
    'Eje Cafetero': ['Chinchina', 'Manizales', 'Pereira'],
    'BOGOTA': ['BOGOTÁ, D.C.', 'Zona Colchone']
  };
  const ZONA_MOCK = ['Cubierta', 'No Cubierta'];
  const CANAL_MOCK = ['Contact Center', 'NPS'];
  const CEDI_MOCK = ['MEDELLIN', 'COTA', 'CALI', 'EJE CAFETERO', 'BARRANQUILLA'];
  const PLACA_MOCK = ['SNS567', 'NHQ532', 'JOV001', 'WER247', 'SKK506', 'EQP064', 'SKR297', 'KNZ777', 'WHP020', 'TTV691', 'LZO015', 'QKL243', 'SPS480', 'SBK998'];
  const NIVEL_CUMPLIMIENTO_MOCK = ['Excelente', 'Cumplido', 'Pendiente / Observación'];
  const SUBTEMA_MOCK = ['Atención del funcionario', 'Entrega incorrecta', 'Entrega parcial', 'Demora entrega Cendis', 'Averia producto no conforme', 'Incumplimiento en la entrega'];

  // Establish standard hardcoded distribution counting to exactly 165 reasons:
  const reasonsByRecord: string[] = [];
  const addReasons = (reason: string, qty: number) => {
    for (let i = 0; i < qty; i++) {
      reasonsByRecord.push(reason);
    }
  };
  addReasons(REASONS_MAP.NOVEDADES_ENTREGA, 84);
  addReasons(REASONS_MAP.ATENCION_FUNCIONARIO, 38);
  addReasons(REASONS_MAP.DEMORA_ENTREGA, 17);
  addReasons(REASONS_MAP.ATENCION_SERVICIO, 10);
  addReasons(REASONS_MAP.MANIPULACION, 5);
  addReasons(REASONS_MAP.DANO_PERDIDA, 4);
  addReasons(REASONS_MAP.AVERIA_PRODUCTO, 3);
  addReasons(REASONS_MAP.INCUMPLIMIENTO_FRANJA_PACTADA, 2);
  addReasons(REASONS_MAP.ENTREGA_PARCIAL, 1);
  addReasons(REASONS_MAP.INCUMPLIMIENTO_FRANJA_HORARIA, 1);

  // Total should be exactly 165
  // If there's any floating-point/off-by-one, ensure we have exactly 165
  while (reasonsByRecord.length < 165) {
    reasonsByRecord.push(REASONS_MAP.NOVEDADES_ENTREGA);
  }
  reasonsByRecord.length = 165;

  // Now let's establish exactly 117 closed cases actions pool
  const closedActionsPool: string[] = [];
  const addActions = (action: string, qty: number) => {
    for (let i = 0; i < qty; i++) {
      closedActionsPool.push(action);
    }
  };
  addActions(ACTIONS_MAP.LLAMADO_ATENCION, 63);
  addActions(ACTIONS_MAP.COBRO_TRANSPORTADOR, 21);
  addActions(ACTIONS_MAP.NO_APLICA, 17);
  addActions(ACTIONS_MAP.REINDUCCION, 7);
  addActions(ACTIONS_MAP.CAPACITACION, 5);
  addActions(ACTIONS_MAP.GESTION_SAC, 2);
  addActions(ACTIONS_MAP.SUSPENSION, 2);

  while (closedActionsPool.length < 117) {
    closedActionsPool.push(ACTIONS_MAP.LLAMADO_ATENCION);
  }
  closedActionsPool.length = 117;

  // Let's generate 165 records deterministically:
  // First 117 will be Closed with those actions, remaining 48 will be active ('Abierto' or 'En proceso')
  for (let i = 0; i < 165; i++) {
    const isClosed = i < 117;
    const estado = isClosed ? 'Cerrado' : (i % 2 === 0 ? 'Abierto' : 'En proceso');
    const motivo = reasonsByRecord[i];

    let accion = 'Pendiente Evaluación';
    if (isClosed) {
      accion = closedActionsPool[i];
    } else {
      if (motivo === REASONS_MAP.DANO_PERDIDA || motivo === REASONS_MAP.AVERIA_PRODUCTO) {
        accion = ACTIONS_MAP.COBRO_TRANSPORTADOR;
      } else if (motivo === REASONS_MAP.ATENCION_FUNCIONARIO) {
        accion = ACTIONS_MAP.LLAMADO_ATENCION;
      } else {
        accion = 'No Asignada';
      }
    }

    const transportadora = getRandom(CARRIERS);
    const cliente = getRandom(CLIENTES);
    const descList = DESCRIPCIONES[motivo] || ['Incidente reportado en planilla oficial de despacho.'];
    const descripcion = getRandom(descList);

    const diasDemora = motivo === REASONS_MAP.DEMORA_ENTREGA ? (i % 4) + 3 : 0;
    const costoMercancia = [45000, 80000, 150000, 240000, 310000, 500000][i % 6];

    let costoPenalizacion = 0;
    if (accion === ACTIONS_MAP.COBRO_TRANSPORTADOR) {
      if (motivo === REASONS_MAP.DANO_PERDIDA) {
        costoPenalizacion = costoMercancia + 40000;
      } else if (motivo === REASONS_MAP.AVERIA_PRODUCTO) {
        costoPenalizacion = Math.round(costoMercancia * 0.8 + 20000);
      } else {
        costoPenalizacion = 35000;
      }
    } else if (accion === ACTIONS_MAP.LLAMADO_ATENCION) {
      costoPenalizacion = 10000;
    } else if (accion === ACTIONS_MAP.SUSPENSION) {
      costoPenalizacion = 150000;
    }

    if (motivo === REASONS_MAP.DEMORA_ENTREGA) {
      costoPenalizacion += diasDemora * 8000;
    }

    // High fidelity dates for MAYO (month: 4) and JUNIO (month: 5)
    // Mayo has exactly 159 cases and Junio has exactly 6 cases (Total 165 cases)
    const isMayo = i < 159;
    let recordDate: Date;
    let radicadoId: string;

    if (isMayo) {
      recordDate = new Date(2026, 4, 1 + (i % 28)); // Mayo
      const yy = '26';
      const mmStr = String(recordDate.getMonth() + 1).padStart(2, '0');
      const ddStr = String(recordDate.getDate()).padStart(2, '0');
      const seq = String(10000000 + i);
      radicadoId = `${yy}${mmStr}${ddStr}${seq}`;
    } else {
      // June exact records as per user's excel screenshots: Row 157, 159, 160, 161, 162, 163
      const juneRecordsData = [
        { id: '26060299902613', date: new Date(2026, 5, 2) },
        { id: '26060110005113', date: new Date(2026, 5, 1) },
        { id: '26060210005132', date: new Date(2026, 5, 2) },
        { id: '26060310005181', date: new Date(2026, 5, 3) },
        { id: '26060310005216', date: new Date(2026, 5, 3) },
        { id: '26060410005226', date: new Date(2026, 5, 4) }
      ];
      const jIdx = i - 159; // range 0 to 5
      radicadoId = juneRecordsData[jIdx].id;
      recordDate = juneRecordsData[jIdx].date;
    }

    const guia = `COL-${Math.floor(Math.random() * 899999 + 100000)}`;
    const regionVal = REGIONS_MOCK[i % REGIONS_MOCK.length];
    const subregionsForRegion = SUBREGIONS_MOCK[regionVal] || ['Medellin'];
    const subRegionVal = subregionsForRegion[i % subregionsForRegion.length];

    records.push({
      id: radicadoId,
      fecha: recordDate.toISOString().split('T')[0],
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
      region: regionVal,
      subRegion: subRegionVal,
      zona: ZONA_MOCK[i % ZONA_MOCK.length],
      canal: CANAL_MOCK[i % CANAL_MOCK.length],
      cedi: CEDI_MOCK[i % CEDI_MOCK.length],
      placa: PLACA_MOCK[i % PLACA_MOCK.length],
      causaRaizSubtema: SUBTEMA_MOCK[i % SUBTEMA_MOCK.length],
      nivelCumplimiento: NIVEL_CUMPLIMIENTO_MOCK[i % NIVEL_CUMPLIMIENTO_MOCK.length],
      estadoGestion: estado === 'Cerrado' ? 'Cerrado' : 'Abierto',
      mes: isMayo ? 'MAYO' : 'JUNIO',
      tipoRequerimiento: i % 3 === 0 ? 'Queja' : (i % 3 === 1 ? 'Reclamo' : 'Petición'),
      colTValue: (i % 4 === 0) ? 'NPS' : 'PQRS',
      colSValue: (i % 4 === 0) ? 'Retractor' : '',
      diasTranscurridos: diasDemora > 0 ? diasDemora : (i % 3),
      cantidad: 1,
      responsable: ['Carlos Alberto Ruíz', 'Laura Camila Ospina', 'Juan David Gómez', 'Diana Marcela Torres', 'Soporte SAC CEDI'][i % 5]
    });
  }

  // Sort by date descending
  return records.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
