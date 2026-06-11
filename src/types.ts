export interface SheetAudit {
  totalRadicados: number;
  unicosRadicados: number;
  filasSinRadicado: number;
  sheetNameUsed: string;
  totalNps?: number;
  totalPqrs?: number;
}

export interface ColumnMappingConfig {
  columnName: string;
  mappedTo: string; // key of PqrsRecord or 'ignore'
  aiInstruction: string; // instruction of what the AI should do with this column
  sampleValues: any[];
}

export interface PqrsRecord {
  id: string;
  fecha: string;
  transportadora: string;
  motivo: string;
  accion: string;
  estado: 'Abierto' | 'Cerrado' | 'En proceso';
  costoMercancia: number;
  diasDemora: number;
  costoPenalizacion: number;
  guia: string;
  cliente: string;
  descripcion: string;
  
  // High fidelity fields from user original Excel
  region?: string;
  subRegion?: string;
  zona?: string;
  canal?: string;
  cedi?: string;
  placa?: string;
  causaRaizSubtema?: string;
  nivelCumplimiento?: string;
  estadoGestion?: string;
  mes?: string;
  tipoRequerimiento?: string;
  colTValue?: string;
  colSValue?: string;
  diasTranscurridos?: number;
  cantidad?: number;
  responsable?: string;
  rawData?: Record<string, any>;
}

export interface GlobalFiltersState {
  year: string;
  month: string;
  week: string;
  city: string;
  regional: string;
  carrier: string;
  status: string;
  reason: string;
  subreason: string;
  assignee: string;
  client: string;
  action: string;
}

export interface RuleConfig {
  motivo: string;
  accion: string;
  porcentajeCobro: number; // For "Cobro al Transportador", usually 100% or 50%
  tarifaBase: number; // Base fine in USD or COP
  multaPorDia: number; // Multiplier if Demora
  strikes: number; // Strike points
  resolucionSLA: number; // Target SLA in days
}

export interface TransportadoraStats {
  nombre: string;
  totalPqrs: number;
  resueltas: number;
  pendientes: number;
  tasaResolucion: number;
  slaPromedio: number; // Days average
  penalizacionTotal: number;
  rating: number; // out of 5 stars based on performance
}
