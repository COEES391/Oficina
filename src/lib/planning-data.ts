export type AppUser = {
  id?: string;
  rfc: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  privileges: string[]; 
};

export type BitacoraEntry = {
  id?: string;
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
  id?: string;
  areaId: string; 
  cct: string;
  schoolName: string;
  date: string;
  purpose: string;
  technicians: string;
  status: 'atendido' | 'en proceso' | 'pendiente';
  observaciones: string;
};

export type ProgramStatus = {
  id?: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido' | 'inactivo' | 'atendido' | 'en proceso' | 'pendiente' | 'suspendida';
  date: string;
  requestDate?: string;
  cct?: string;
  schoolName?: string;
  userName?: string; 
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
  emails?: string[]; // Soporte para múltiples correos
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
  bibliotecaFases?: {
    fase1: boolean;
    fase2: boolean;
    fase3: boolean;
    fase4: boolean;
    fase4_1: boolean;
    fase4_2: boolean;
    fase5: boolean;
    fase6: boolean;
    fase7: boolean;
    fase7_1: boolean;
    fase7_formsUrl?: string;
    personalCapacitado: number;
    equiposHabilitados: number;
  };
};

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
  evidencePhotos?: string[];
  observaciones?: string;
  alumnosBeneficiados?: number;
  docentesBeneficiados?: number;
};

// Datos maestros iniciales ahora vacíos para favorecer Firestore
export const programsData: ProgramStatus[] = [];
export const supportData: any[] = [];
export const trainingRecords: TrainingRecord[] = [];
