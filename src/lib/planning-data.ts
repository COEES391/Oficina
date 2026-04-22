export type SupportTicket = {
  id: string;
  cct: string;
  schoolName: string;
  zonaEscolar: string;
  sector: string;
  modalidad: string;
  municipio: string;
  region: string;
  valle: string;
  responsables: string[];
  oficinaRegionalAtencion?: string;
  numeroOficio: string;
  alumnosBeneficiados: number;
  docentesBeneficiados: number;
  numeroEquipos: number;
  tipoIncidencia: 'red edusat' | 'red local' | 'instalación red local' | 'mantenimiento preventivo' | 'mantenimiento correctivo' | 'otro';
  materialUtilizado: string;
  setes: 'S' | 'N';
  observaciones: string;
  descripcionEquipo: string;
  fechaEntrada: string;
  fechaSalida: string;
  serviciosMC: number;
  serviciosMP: number;
  status: 'pendiente' | 'en proceso' | 'atendido';
  reportPdf?: string;
  evidencePhotos?: string[];
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
  asistentePaterno: string;
  asistenteMaterno: string;
  asistenteNombres: string;
  asistenteRFC: string;
  asistenteGenero?: 'MASCULINO' | 'FEMENINO' | '';
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
  cctSede: string;
  setes: 'S' | 'N';
  observaciones: string;
  reportPdf?: string;
  evidencePhotos?: string[];
};

export type ProgramStatus = {
  id: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido';
  date: string; // YYYY-MM-DD
  reportPdf?: string;
  evidencePhotos?: string[];
};

export const supportData: SupportTicket[] = [
  { 
    id: 'S001', 
    cct: '15EES0001Z', 
    schoolName: 'Secundaria Fed. 1',
    zonaEscolar: '12',
    sector: '01', 
    modalidad: 'General',
    municipio: 'Toluca',
    region: 'I',
    valle: 'Toluca',
    responsables: ['Ing. Carlos Ruiz'],
    oficinaRegionalAtencion: 'Oficina de Tecnóloga Educativa Toluca',
    numeroOficio: 'OF-2024-001',
    alumnosBeneficiados: 450,
    docentesBeneficiados: 25,
    numeroEquipos: 15,
    tipoIncidencia: 'mantenimiento preventivo',
    materialUtilizado: 'Aire comprimido, alcohol isopropílico',
    setes: 'S',
    observaciones: 'Limpieza física realizada',
    descripcionEquipo: '15 Computadoras HP',
    fechaEntrada: '2024-05-20',
    fechaSalida: '2024-05-20',
    serviciosMC: 0,
    serviciosMP: 15,
    status: 'atendido', 
  },
];

export const trainingRecords: TrainingRecord[] = [];
export const programsData: ProgramStatus[] = [
  { id: 'P1', name: 'Equipamiento Tecnológico 2024', progress: 85, status: 'activo', date: '2024-01-15' },
  { id: 'P2', name: 'Conectividad Rural', progress: 40, status: 'planeacion', date: '2024-02-10' },
  { id: 'P3', name: 'Capacitación a Directivos', progress: 100, status: 'concluido', date: '2024-03-05' },
];
