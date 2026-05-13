export type ProgramStatus = {
  id: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido' | 'inactivo';
  date: string;
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
  agrupado?: string;
  vertiente?: string;
  fechaAlta?: string;
  fechaModif?: string;
  fechaRevision?: string;
  fechaSuspension?: string;
  asistentes?: any[];
};

const getEditorialData = (): ProgramStatus[] => {
  const data: ProgramStatus[] = [];
  for (let i = 1; i <= 827; i++) {
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
      fechaModif: '2023/04/19',
      fechaRevision: '2025/09/01',
      date: '2023/04/19',
      status: i % 4 === 0 ? 'planeacion' : 'concluido',
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      observaciones: 'Auditoría COEES 2026 conforme a lineamientos.',
      name: 'Conoce mi Escuela',
      progress: 100,
      fechaSuspension: i % 20 === 0 ? '2024/05/20' : ''
    });
  }
  return data;
};

export const programsData: ProgramStatus[] = [
  { id: 'BD-1', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S' },
  { id: 'CI-1', name: 'Cuentas Institucionales', cct: '15DES0065B', schoolName: 'JUAN PÉREZ SÁNCHEZ', email: 'des0065b@desysa.gob.mx', valle: 'MÉXICO', modalidad: 'DES', status: 'activo', date: '2026-01-10', progress: 100 },
  ...getEditorialData()
];

export type SupportTicket = {
  id: string;
  cct: string;
  schoolName: string;
  zonaEscolar?: string;
  sector?: string;
  modalidad?: string;
  municipio?: string;
  region?: string;
  valle?: string;
  responsables: string[];
  oficinaRegionalAtencion: string;
  numeroOficio?: string;
  alumnosBeneficiados?: number;
  docentesBeneficiados?: number;
  numeroEquipos: number;
  tipoIncidencia: 'red edusat' | 'red local' | 'instalación red local' | 'mantenimiento preventivo' | 'mantenimiento correctivo';
  materialUtilizado?: string;
  setes?: 'S' | 'N';
  observaciones?: string;
  descripcionEquipo?: string;
  fechaEntrada: string;
  fechaSalida?: string;
  serviciosMC: number;
  serviciosMP: number;
  status: 'atendido' | 'en proceso' | 'pendiente';
  reportPdf?: string;
  evidencePhotos?: string[];
};

export const supportData: SupportTicket[] = [
  { 
    id: 'S-001', 
    cct: '15DES0065B', 
    schoolName: 'JUAN PÉREZ SÁNCHEZ', 
    status: 'atendido', 
    tipoIncidencia: 'mantenimiento preventivo', 
    fechaEntrada: '2024-05-20',
    valle: 'MEXICO',
    municipio: 'AMECAMECA',
    modalidad: 'DES',
    oficinaRegionalAtencion: 'Oficina de Tecnóloga Educativa Nezahualcóyotl',
    responsables: ['ING. CARLOS LÓPEZ'],
    serviciosMC: 0,
    serviciosMP: 12,
    numeroEquipos: 12
  }
];

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
  observaciones: string;
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
  evidencePhotos?: string[];
};

export const trainingRecords: TrainingRecord[] = [];