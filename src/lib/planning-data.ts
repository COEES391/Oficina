
export type AppUser = {
  id: string;
  rfc: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  privileges: string[]; // ['bitacora-atres', 'planeacion', 'soporte', 'capacitacion', 'programas', 'base-cct', 'usuarios']
};

export type BitacoraEntry = {
  id: string;
  folio: string;
  cct: string;
  schoolName: string;
  servicio: string;
  oficina: string;
  fecha: string;
  tecnico: string;
  tipo: 'FORMAL' | 'LIVE';
  status: 'atendido' | 'proceso' | 'pendiente';
  pdfData?: string;
  pdfName?: string;
  excelData?: string;
  excelName?: string;
  requesterName?: string;
  requesterEmail?: string;
  helpTopic?: string;
  ticketDetail?: string;
};

export type VisitSchedule = {
  id: string;
  areaId: string; // 'soporte' | 'capacitacion' | 'programas'
  cct: string;
  schoolName: string;
  date: string;
  purpose: string;
  technicians: string;
  status: 'atendido' | 'en proceso' | 'pendiente';
  observaciones: string;
};

export type ProgramStatus = {
  id: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido' | 'inactivo' | 'atendido' | 'en proceso' | 'pendiente';
  date: string;
  requestDate?: string;
  cct?: string;
  schoolName?: string;
  zonaEscolar?: string;
  sector?: string;
  modalidad?: string;
  municipio?: string;
  region?: string;
  valle?: string;
  numeroEquipos?: number;
  observaciones?: string;
  capacitacion?: 'S' | 'N';
  email?: string;
  asistentes?: any[];
  latitud?: string;
  longitud?: string;
  tecnicos?: string;
  tipoIncidencia?: 'red edusat' | 'red local' | 'mantenimiento' | 'teleplanteles' | 'cuenta institucional';
  oficinaRegionalAtencion?: string;
  numeroOficio?: string;
  alumnosBeneficiados?: number;
  docentesBeneficiados?: number;
  serviciosMC?: number;
  serviciosMP?: number;
  reportPdf?: string;
  evidencePhotos?: string[];
  lugarServicio?: string;
  lugarServicioOtro?: string;
  diagnosticoRed?: 'ampliacion' | 'mantenimiento' | 'nueva red' | '';
  cuentaRedLocal?: 'S' | 'N' | '';
  electricaAdecuada?: 'S' | 'N' | '';
  cuentaInternet?: 'S' | 'N' | '';
  proveedorInternet?: string;
  anchoBanda?: string;
  numNodos?: number;
  mantenimientoChecklist?: string[];
  numDecodificadores?: number;
  numSerie?: string;
  estatusSeñal?: 'débil' | 'estable' | 'excelente' | '';
  numReportes?: number;
  bibliotecaFases?: {
    fase1: boolean;
    fase2: boolean;
    fase3: boolean;
    fase4: boolean;
    fase5: boolean;
    fase6: boolean;
    fase7: boolean;
    personalCapacitado: number;
    equiposHabilitados: number;
  };
  mantenimientoDetalle?: {
    equipoTecnologico: 'HDT' | 'EQUIPO DE COMPUTO' | 'OTRO' | '';
    equipoTecnologicoOtro?: string;
    equipos: Array<{ equipo: string; marca: string; serie: string; censal: string }>;
    fallaIdentificada: string;
    servicioRealizado: string;
  };
  edusatDetalle?: {
    micropak: string[];
    antena: string[];
    decodificadorAcciones: string[];
    cableado: string[];
    preventivo: string[];
    numCensal: string;
    numSerie: string;
    calidadSeñal: string;
    materiales: Array<{ material: string; cantidad: string; actividades: string }>;
  };
};

export const programsData: ProgramStatus[] = [];
export const supportData: any[] = [];
export const trainingRecords: TrainingRecord[] = [];
export type TrainingRecord = {
  id: string;
  cursoGrupo: string;
  cursoNombre: string;
  duracionHoras: number;
  fechaInicio: string;
  fechaTermino: string;
  instructores: string[];
  numeroOficio: string;
  materialUtilizado: string;
  cctSede: string;
  setes: 'S' | 'N';
  asistentePaterno: string;
  asistenteMaterno: string;
  asistenteNombres: string;
  asistenteRFC: string;
  asistenteGenero: 'MASCULINO' | 'FEMENINO' | '';
  asistenteFuncion: string;
  asistenteEmail: string;
  asistenteCCT: string;
  asistenteNombreCT: string;
  asistenteZE: string;
  asistenteSector: string;
  asistenteModalidad: string;
  asistenteMunicipio: string;
  asistenteRegion: string;
  asistenteValle: string;
  reportPdf?: string;
  evidencePhotos: string[];
  observaciones: string;
  alumnosBeneficiados: number;
  docentesBeneficiados: number;
};
