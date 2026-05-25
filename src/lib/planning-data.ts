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
  latitud?: string;
  longitud?: string;
  agrupado_editorial?: string;
  tecnicos?: string;
  // Campos para ATRES (Reporte Técnico)
  tipoIncidencia?: 'red edusat' | 'red local' | 'mantenimiento' | 'teleplanteles';
  oficinaRegionalAtencion?: string;
  numeroOficio?: string;
  alumnosBeneficiados?: number;
  docentesBeneficiados?: number;
  serviciosMC?: number;
  serviciosMP?: number;
  reportPdf?: string;
  evidencePhotos?: string[];
  // Campos Edusat
  numCensal?: string;
  serieDecodificador?: string;
  calidadSeñal?: 'nulo' | 'óptimo' | 'excelente' | '';
  materialesEdusat?: { name: string; quantity: number }[];
  // Campos RED Local
  lugarServicio?: string;
  lugarServicioOtro?: string;
  diagnosticoRed?: 'ampliacion' | 'mantenimiento' | 'nueva red' | '';
  cuentaRedLocal?: 'S' | 'N' | '';
  electricaAdecuada?: 'S' | 'N' | '';
  cuentaInternet?: 'S' | 'N' | '';
  proveedorInternet?: string;
  anchoBanda?: string;
  numNodos?: number;
  materialesRedLocal?: { name: string; quantity: number }[];
  mantenimientoChecklist?: string[];
  // Campos Teleplanteles
  numDecodificadores?: number;
  numSerie?: string;
  estatusSeñal?: 'débil' | 'estable' | 'excelente' | '';
  numReportes?: number;
  // Campos Mantenimiento Detallado (Nueva Imagen)
  mantenimientoDetalle?: {
    equipoTecnologico: 'HDT' | 'EQUIPO DE COMPUTO' | 'OTRO' | '';
    equipoTecnologicoOtro?: string;
    equipos: Array<{ equipo: string; marca: string; serie: string; censal: string }>;
    fallaIdentificada: string;
    servicioRealizado: string;
  };
};

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
  tecnicos?: string;
  oficinaRegionalAtencion: string;
  numeroOficio?: string;
  alumnosBeneficiados?: number;
  docentesBeneficiados?: number;
  numeroEquipos: number;
  tipoIncidencia: 'red edusat' | 'red local' | 'mantenimiento' | 'teleplanteles';
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
  // Campos especializados para Teleplanteles
  numDecodificadores?: number;
  numSerie?: string;
  estatusSeñal?: 'débil' | 'estable' | 'excelente' | '';
  contratoFile?: string;
  numReportes?: number;
  // Campos especializados para RED Edusat
  numCensal?: string;
  serieDecodificador?: string;
  calidadSeñal?: 'nulo' | 'óptimo' | 'excelente' | '';
  materialesEdusat?: { name: string; quantity: number }[];
  // Campos especializados para RED Local
  lugarServicio?: string;
  lugarServicioOtro?: string;
  diagnosticoRed?: 'ampliacion' | 'mantenimiento' | 'nueva red' | '';
  cuentaRedLocal?: 'S' | 'N' | '';
  electricaAdecuada?: 'S' | 'N' | '';
  cuentaInternet?: 'S' | 'N' | '';
  proveedorInternet?: string;
  anchoBanda?: string;
  numNodos?: number;
  materialesRedLocal?: { name: string; quantity: number }[];
  mantenimientoChecklist?: string[];
  // Campos Mantenimiento Detallado (Nueva Imagen)
  mantenimientoDetalle?: {
    equipoTecnologico: 'HDT' | 'EQUIPO DE COMPUTO' | 'OTRO' | '';
    equipoTecnologicoOtro?: string;
    equipos: Array<{ equipo: string; marca: string; serie: string; censal: string }>;
    fallaIdentificada: string;
    servicioRealizado: string;
  };
};

const getEditorialData = (): ProgramStatus[] => {
  const data: ProgramStatus[] = [];
  for (let i = 1; i <= 10; i++) {
    const isMexico = i % 2 === 0;
    const vert = 'DES';
    const sector = '09';
    const zona = '023';
    const cct = `15DES0065B`;
    
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
      status: 'concluido',
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      observaciones: 'Auditoría COEES 2026 conforme a lineamientos.',
      name: 'Conoce mi Escuela',
      progress: 100
    });
  }
  return data;
};

const getAccountsData = (): ProgramStatus[] => {
  const data: ProgramStatus[] = [];
  for (let i = 1; i <= 10; i++) {
    const cct = `15DES006${i}X`;
    const valle = i % 2 === 0 ? 'MEXICO' : 'TOLUCA';
    
    data.push({
      id: `ACC-${i}`,
      name: 'Cuentas Institucionales',
      cct: cct,
      schoolName: `SECUNDARIA FEDERAL ${cct}`,
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      valle: valle,
      modalidad: 'DES',
      status: 'activo',
      date: '2026-02-15',
      progress: 100
    });
  }
  return data;
};

const getGeopositioningData = (): ProgramStatus[] => {
  const rawDTV = [
    ['15DTV0001X', '-99.146741', '19.818558'], 
    ['15DTV0002W', '-98.914215', '19.551621'], 
    ['15DTV0003V', '-98.874580', '19.456212'],
    ['15DTV0004U', '-99.181050', '19.550817'], 
    ['15DTV0005T', '-99.223951', '19.460191']
  ];

  return rawDTV.map(([cct, lon, lat], i) => ({
    id: `GEO-${i + 1}`,
    name: 'Geoposición',
    cct,
    longitud: lon,
    latitud: lat,
    schoolName: `PLANTEL ${cct}`,
    zonaEscolar: 'S/Z',
    sector: 'S/S',
    valle: 'ESTADO DE MEXICO',
    municipio: 'LOCALIDAD PENDIENTE',
    status: 'activo',
    date: '2026-02-15',
    progress: 100
  }));
};

export const programsData: ProgramStatus[] = [
  { id: 'BD-1', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S', alumnosBeneficiados: 450, docentesBeneficiados: 25 },
  ...getEditorialData(),
  ...getAccountsData(),
  ...getGeopositioningData()
];

export const supportData: SupportTicket[] = [
  { 
    id: 'S-001', 
    cct: '15DES0065B', 
    schoolName: 'DR. MANUEL SANDOVAL VALLARTA', 
    status: 'atendido', 
    tipoIncidencia: 'mantenimiento', 
    fechaEntrada: '2024-05-20',
    valle: 'MEXICO',
    municipio: 'AMECAMECA',
    modalidad: 'DES',
    oficinaRegionalAtencion: 'Oficina de Tecnóloga Educativa Nezahualcóyotl',
    responsables: ['ING. CARLOS LÓPEZ'],
    tecnicos: 'ING. CARLOS LÓPEZ',
    serviciosMC: 0,
    serviciosMP: 12,
    numeroEquipos: 12
  }
];

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
  evidencePhotos: string[];
  observaciones: string;
  alumnosBeneficiados: number;
  docentesBeneficiados: number;
};
