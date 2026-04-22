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
  numeroOficio: string;
  alumnosBeneficiados: number;
  numeroEquipos: number;
  materialUtilizado: string;
  setes: 'S' | 'N';
  observaciones: string;
  descripcionEquipo: string;
  fechaEntrada: string;
  fechaSalida: string;
  serviciosMC: number;
  serviciosMP: number;
  status: 'pendiente' | 'en proceso' | 'resuelto';
  reportPdf?: string; // Base64 or URL
  evidencePhotos?: string[]; // Array of Base64 or URLs
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
    responsables: ['Ing. Carlos Ruiz', 'Lic. Ana Soto'],
    numeroOficio: 'OF-2024-001',
    alumnosBeneficiados: 450,
    numeroEquipos: 15,
    materialUtilizado: 'Cable UTP Cat6, Conectores RJ45',
    setes: 'S',
    observaciones: 'Pendiente configuración de switch',
    descripcionEquipo: 'Servidor Dell PowerEdge y 14 terminales',
    fechaEntrada: '2024-05-20',
    fechaSalida: '',
    serviciosMC: 1,
    serviciosMP: 0,
    status: 'pendiente', 
  },
];

export const trainingRecords: TrainingRecord[] = [
  {
    id: 'C001',
    cursoGrupo: 'Secundarias Generales',
    cursoNombre: 'Manejo de Herramientas de Colaboración',
    duracionHoras: 20,
    fechaInicio: '2024-05-01',
    fechaTermino: '2024-05-05',
    instructores: ['Gustavo Bello', '', ''],
    numeroOficio: 'OF-CAP-001',
    materialUtilizado: 'Guías digitales, proyector',
    asistentePaterno: 'García',
    asistenteMaterno: 'López',
    asistenteNombres: 'Juan',
    asistenteRFC: 'GALJ800101H12',
    asistenteFuncion: 'Docente',
    asistenteEmail: 'juan.garcia@edomex.gob.mx',
    asistenteCCT: '15EES0123A',
    asistenteNombreCT: 'Sec. Ofic. 12',
    asistenteZE: '05',
    asistenteSector: '02',
    asistenteModalidad: 'General',
    asistenteMunicipio: 'Metepec',
    asistenteRegion: 'I',
    asistenteValle: 'Toluca',
    cctSede: '15EES0001Z',
    setes: 'S',
    observaciones: 'Participación destacada',
  }
];

export const programsData: ProgramStatus[] = [
  { id: 'P001', name: 'Conectividad Escolar 2024', progress: 75, status: 'activo' },
  { id: 'P002', name: 'Renovación de Equipamiento', progress: 40, status: 'planeacion' },
  { id: 'P003', name: 'Cero Rezago Digital', progress: 100, status: 'concluido' },
];