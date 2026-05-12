
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
  agrupado?: string;
  vertiente?: string;
  fechaAlta?: string;
  fechaModif?: string;
  fechaRevision?: string;
  fechaSuspension?: string;
  email?: string;
};

const getEditorialData = (): ProgramStatus[] => {
  const data: ProgramStatus[] = [
    { id: 'ED-1', cct: '15DES0002Q', agrupado: 'DESMEXICO09024', vertiente: 'DES', sector: '09', zonaEscolar: '024', fechaAlta: '2022/10/19', fechaModif: '2022/10/20', fechaRevision: '2025/09/01', date: '2023/04/19', status: 'concluido', email: 'des0002q@desysa.gob.mx', observaciones: '', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-2', cct: '15DES0003P', agrupado: 'DESMEXICO02006', vertiente: 'DES', sector: '02', zonaEscolar: '006', fechaAlta: '2009/11/26', fechaModif: '2022/10/12', fechaRevision: '2024/08/07', date: '2023/02/02', status: 'concluido', email: 'des0003p@desysa.gob.mx', observaciones: '9-12-09 Está bien; solo faltó informar de qué ciclo escolar son los alumnos destacados...', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-3', cct: '15DES0004O', agrupado: 'DESMEXICO09023', vertiente: 'DES', sector: '09', zonaEscolar: '023', fechaAlta: '2010/01/22', fechaModif: '2022/10/19', fechaRevision: '2023/04/19', date: '2022/11/03', status: 'concluido', email: 'des0004o@desysa.gob.mx', observaciones: '17-05-10: Historia muy pobre...', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-4', cct: '15DES0005N', agrupado: 'DESMEXICO02008', vertiente: 'DES', sector: '02', zonaEscolar: '008', fechaAlta: '2006/03/28', fechaModif: '2022/11/08', fechaRevision: '2022/11/08', date: '2022/11/08', status: 'concluido', email: 'des0005n@desysa.gob.mx', observaciones: '18-01-06: Actualizar alumnos destacados...', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-5', cct: '15DES0006M', agrupado: 'DESTOLUCA07028', vertiente: 'DES', sector: '07', zonaEscolar: '028', fechaAlta: '2008/10/29', fechaModif: '2023/01/13', fechaRevision: '2022/09/26', date: '2023/01/23', status: 'concluido', email: 'des0006m@desysa.gob.mx', observaciones: '11-09-09 Confunden logros...', name: 'Conoce mi Escuela', progress: 100 }
  ];

  for (let i = 6; i <= 827; i++) {
    const isMexico = i % 2 === 0;
    const vert = i > 400 ? (i > 600 ? 'DTV' : 'DST') : 'DES';
    const sector = String(Math.floor(i / 100) + 1).padStart(2, '0');
    const zona = String(i % 100).padStart(3, '0');
    const cct = `15${vert}${zona}${String.fromCharCode(65 + (i % 26))}`;
    
    data.push({
      id: `ED-${i}`,
      cct: cct,
      agrupado: `${vert}${isMexico ? 'MEXICO' : 'TOLUCA'}${sector}${zona}`,
      vertiente: vert,
      sector: sector,
      zonaEscolar: zona,
      fechaAlta: '2022/10/19',
      fechaModif: '2022/10/20',
      fechaRevision: '2025/09/01',
      date: '2023/04/19',
      status: i % 3 === 0 ? 'planeacion' : 'concluido',
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      observaciones: 'Auditado por COEES para ciclo vigente conforme a lineamientos de Incorporación.',
      name: 'Conoce mi Escuela',
      progress: 100
    });
  }
  return data;
};

export const programsData: ProgramStatus[] = [
  { id: 'PROG-BD-1', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', sector: '01', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S', cursoNombre: 'Uso de Biblioteca Digital v2', cursoGrupo: 'GRUPO A', duracionHoras: 20, fechaInicio: '2025-05-01', fechaTermino: '2025-05-15', cctSede: '15DES0001R' },
  { id: 'PROG-CI-1', name: 'Cuentas Institucionales', cct: '15DES0065B', schoolName: 'SECUNDARIA GRAL AMECAMECA', valle: 'MÉXICO', modalidad: 'DES GOB', sector: '01', status: 'concluido', date: '2026-01-10', progress: 100, asistentes: [{ nombres: 'Juan', paterno: 'Pérez', materno: 'Sánchez', email: 'des0065b@desysa.gob.mx', rfc: 'ABCD123456', genero: 'MASCULINO', funcion: 'DIRECTOR', cct: '15DES0065B', nombreCT: 'AMECAMECA', ze: '01', sector: '01', modalidad: 'DES', municipio: 'AMECAMECA', region: 'I', valle: 'MÉXICO', departamento: 'DIRECCIÓN' }] },
  { id: 'PROG-CI-2', name: 'Cuentas Institucionales', cct: '15DST0001J', schoolName: 'SECUNDARIA TECNICA 1', valle: 'TOLUCA', modalidad: 'DST GOB', sector: '02', status: 'planeacion', date: '2026-01-11', progress: 50, asistentes: [{ nombres: 'María', paterno: 'López', materno: 'Díaz', email: 'dst0001j@desysa.edu.mx', rfc: 'LMDA123456', genero: 'FEMENINO', funcion: 'DOCENTE', cct: '15DST0001J', nombreCT: 'TOLUCA 1', ze: '02', sector: '02', modalidad: 'DST', municipio: 'TOLUCA', region: 'I', valle: 'TOLUCA', departamento: 'AULA' }] },
  ...getEditorialData()
];

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
