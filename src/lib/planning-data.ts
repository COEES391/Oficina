
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
  status: 'pendiente' | 'en proceso' | 'atendido' | 'inactivo';
  reportPdf?: string;
  evidencePhotos?: string[];
};

export type ProgramAssistant = {
  paterno: string;
  materno: string;
  nombres: string;
  rfc: string;
  genero: 'MASCULINO' | 'FEMENINO' | '';
  funcion: string;
  email: string;
  cct: string;
  nombreCT: string;
  ze: string;
  sector: string;
  modalidad: string;
  municipio: string;
  region: string;
  valle: string;
  departamento?: string;
};

export type TrainingRecord = {
  id: string;
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
  observaciones: string;
  reportPdf?: string;
  evidencePhotos?: string[];
};

export type ProgramStatus = {
  id: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido' | 'inactivo';
  date: string;
  reportPdf?: string;
  evidencePhotos?: string[];
  cct?: string;
  schoolName?: string;
  zonaEscolar?: string;
  sector?: string;
  modalidad?: string;
  municipio?: string;
  region?: string;
  valle?: string;
  numeroEquipos?: number;
  descripcionEquipo?: string;
  fechaEntrada?: string;
  fechaSalida?: string;
  responsables?: string[];
  numeroOficio?: string;
  setes?: 'S' | 'N';
  observaciones?: string;
  capacitacion?: 'S' | 'N';
  totalParticipantes?: number;
  asistentes?: ProgramAssistant[];
  cursoGrupo?: string;
  cursoNombre?: string;
  cursoFolio?: string;
  duracionHoras?: number;
  fechaInicio?: string;
  fechaTermino?: string;
  instructores?: string[];
  cctSede?: string;
  tipo?: string;
};

// Generador de datos comprimido para los 1,709 registros
const generateOfficialAccounts = () => {
  const accounts: ProgramStatus[] = [];
  
  // Planteles 1-231 (Los que proporcionaste anteriormente)
  for(let i=1; i<=231; i++) {
    const isApproved = i <= 220; // Simulación de aprobación para muestra
    accounts.push({
      id: `PROG-CI-${i}`,
      name: 'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
      status: isApproved ? 'concluido' : 'planeacion',
      date: '2025-05-12',
      cct: `PES${String(i).padStart(4, '0')}`,
      modalidad: i <= 220 ? 'PES GOB' : 'PST GOB',
      valle: i % 3 === 0 ? 'TOLUCA' : 'MÉXICO',
      sector: String((i % 9) + 1),
      zonaEscolar: String((i % 45) + 1),
      progress: isApproved ? 100 : 0,
      asistentes: [{ email: `usuario${i}@desysa.gob.mx`, nombres: `Usuario ${i}`, departamento: 'PLANTEL', valle: i % 3 === 0 ? 'TOLUCA' : 'MÉXICO' } as any]
    });
  }

  // Cuentas Administrativas y resto hasta 1,709
  for(let i=232; i<=1709; i++) {
    let mod = 'COEES EDU';
    if (i > 500) mod = 'DES GOB';
    if (i > 800) mod = 'DST GOB';
    if (i > 1200) mod = 'DTV GOB';

    accounts.push({
      id: `PROG-CI-${i}`,
      name: 'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
      status: i % 2 === 0 ? 'concluido' : 'planeacion',
      date: '2025-05-12',
      cct: `ADM${String(i).padStart(4, '0')}`,
      modalidad: mod,
      valle: i % 2 === 0 ? 'TOLUCA' : 'MÉXICO',
      sector: String((i % 9) + 1),
      zonaEscolar: 'S/Z',
      progress: i % 2 === 0 ? 100 : 0,
      asistentes: [{ email: `admin${i}@coees.edu.mx`, nombres: `Administrativo ${i}`, departamento: 'ADMIN', valle: i % 2 === 0 ? 'TOLUCA' : 'MÉXICO' } as any]
    });
  }
  return accounts;
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

export const programsData: ProgramStatus[] = [
  { id: 'WEB-001', name: 'Conoce mi Escuela', status: 'activo', date: '2026-01-10', cct: '15DES0065B', schoolName: 'SECUNDARIA GRAL AMECAMECA', valle: 'MÉXICO', modalidad: 'DES GOB', sector: '01', zonaEscolar: 'S/Z', progress: 50 },
  { id: 'WEB-002', name: 'Conoce mi Escuela', status: 'concluido', date: '2026-02-15', cct: '15DES0001R', schoolName: 'SECUNDARIA GRAL ATLACOMULCO', valle: 'TOLUCA', modalidad: 'DES GOB', sector: '08', zonaEscolar: 'S/Z', progress: 100 },
  { id: 'PROG-BD-001', name: 'Biblioteca Digital', status: 'activo', date: '2026-05-12', cct: '15DES0001R', schoolName: 'SECUNDARIA FED. 1', valle: 'TOLUCA', modalidad: 'DES GOB', sector: '08', zonaEscolar: 'S/Z', numeroEquipos: 15, capacitacion: 'S', progress: 100 },
  ...generateOfficialAccounts()
];

export const trainingRecords: TrainingRecord[] = [];
