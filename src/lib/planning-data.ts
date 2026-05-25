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
  asistentes?: any[];
  latitud?: string;
  longitud?: string;
  tecnicos?: string;
  tipoIncidencia?: 'red edusat' | 'red local' | 'mantenimiento' | 'teleplanteles';
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
  numDecodificadores?: number;
  numSerie?: string;
  estatusSeñal?: 'débil' | 'estable' | 'excelente' | '';
  contratoFile?: string;
  numReportes?: number;
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

const getAccountsData = (): ProgramStatus[] => {
  const rawPeople = [
    { n: "Guadalupe", p: "Avila Morales", r: "AIMG710117CC6", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.gam@desysa.edu.mx", f: "DOCENTE" },
    { n: "Mercedes", p: "Blancas Jimenez", r: "BAJM6409249P9", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.mbj@desysa.edu.mx", f: "ADMINISTRATIVO" },
    { n: "Cuauhtemoc", p: "Camargo Castillo", r: "CACC811102S85", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.ccc@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Mayra Yetlanezi", p: "Castro Camarillo", r: "CACM911021CN5", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.mycc@desysa.edu.mx", f: "DOCENTE" },
    { n: "Luis Enrique", p: "Cortes Mejía", r: "COML960713L23", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.lecm@desysa.edu.mx", f: "ASISTENTE" },
    { n: "Goria Elizabeth", p: "Fuentes Camargo", r: "FUCG750329EBA", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.gefc@desysa.edu.mx", f: "SUBDIRECTORA" },
    { n: "Luis Alberto", p: "García Fernandez", r: "GAFL751210R50", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.lagf@desysa.edu.mx", f: "DOCENTE" },
    { n: "Ambar Gabriela", p: "Páez Cantón", r: "PACA710116GJ9", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.agpc@desysa.edu.mx", f: "DOCENTE" },
    { n: "Itzel Karyme", p: "Perea Ake", r: "PEAI950404NP0", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.ikpa@desysa.gob.mx", f: "DOCENTE" },
    { n: "Michelle Amairani", p: "Pérez Carrasco", r: "PECM9304295B8", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.mapc@desysa.edu.mx", f: "DOCENTE" },
    { n: "Jesus Omar", p: "Pérez Gonzalez", r: "PEGJ800715Q40", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.jopg@desysa.edu.mx", f: "DOCENTE" },
    { n: "Jose Felipe", p: "Sanchez Pozos", r: "SAPF720622FHA", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.jfsp@desysa.edu.mx", f: "DOCENTE" },
    { n: "Edgar", p: "Solis Vera", r: "SOVE730425FN7", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.esv@desysa.edu.mx", f: "DOCENTE" },
    { n: "Norna Graciela", p: "Torres Vargas", r: "TOVN780906QP7", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.ngtv@desysa.edu.mx", f: "DOCENTE" },
    { n: "Xochitl", p: "Martinez Olivares", r: "MAOX821128A80", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.xmo@desysa.edu.mx", f: "DOCENTE" },
    { n: "Valentin Gilberto", p: "Rodriguez Zavala", r: "ROZV810429HZ8", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.vgrz@desysa.edu.mx", f: "DOCENTE" },
    { n: "Esperanza", p: "Sanchez Campos", r: "SACE5409074I3", c: "15DTV0044V", d: "Telesecundarias", e: "dtv0044v.esc@desysa.edu.mx", f: "ASISTENTE" },
    { n: "NORMA ANGELICA", p: "DIAZ SALAS", r: "DISN6803277W4", c: "15FIS0023X", d: "Generales", e: "fis0023x.nads@desysa.edu.mx", f: "ADMINISTRATIVO" },
    { n: "ISIDRO CONSTANTINO", p: "TORRES GONZALEZ", r: "TOGI500515AS6", c: "15FIS0023X", d: "Generales", e: "fis0023x.ictg@desysa.edu.mx", f: "SUPERVISOR" },
    { n: "Rolando", p: "Solano Ramírez", r: "SORR521120365", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.rsr@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Álvaro", p: "López Saldaña", r: "LOSA850322MK8", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.als@desysa.edu.mx", f: "DOCENTE" },
    { n: "Karla Patricia", p: "Arreola Gutierrez", r: "AEGK8007232L0", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.kpag@desysa.edu.mx", f: "DOCENTE" },
    { n: "Fátima Araceli", p: "Castro Arriaga", r: "CAAF761022468", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.faca@desysa.edu.mx", f: "DOCENTE" },
    { n: "Levi Helem", p: "Morales Godinez", r: "MOGL890819EH6", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.lhmg@desysa.edu.mx", f: "DOCENTE" },
    { n: "Ruth", p: "Cadenas Pliego", r: "CAPR480112V18", c: "15DES0236E", d: "Generales", e: "des0236e.rcp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Alma Rosa", p: "Camacho Guzmán", r: "CAGX921116E14", c: "15DES0236E", d: "Generales", e: "des0236e.arcg@desysa.edu.mx", f: "DOCENTE" },
    { n: "Cesar", p: "Aguilar Marcos", r: "AUMC7210231G5", c: "15DTV0022J", d: "Telesecundaria", e: "dtv0022jcam@desysa.edu.mx", f: "DOCENTE" },
    { n: "Raul", p: "Garcia Lopez", r: "GALR910830RU7", c: "15DTV0094C", d: "Telesecundaria", e: "dtv0094c.rgl@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MARCO ANTONIO", p: "HERNANDEZ GALLARDO", r: "HEGM4805249S8", c: "15DTV0006S", d: "TELESECUNDARIA", e: "dtv0006smahg@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Martha Imelda", p: "Ramirez Quiroz", r: "RAQM570512TF0", c: "15FTS0002G", d: "Telesecundarias", e: "fts0002gmirq@desysa.edu.mx", f: "JEFA DE SECTOR" },
    { n: "Victor Hugo", p: "Miranda Rosas", r: "MIRV640913FE4", c: "15DTV0032Q", d: "Telesecundarias", e: "dtv0032qvhmr@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Adelaido", p: "Azpeitia Hernandez", r: "AEHA701116MA5", c: "15DTV0123H", d: "Telesecundarias", e: "dtv0123h.aah@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Hector Alejandro", p: "Rodriguez Gonzalez", r: "ROGH8105131G5", c: "15DES0046N", d: "Generales", e: "des0046n.hrg@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Elizander", p: "Dominguez Peña", r: "DOPE700225KW7", c: "15DTV0271Q", d: "Telesecundarias", e: "dtv0271q.edp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Catalina Juana", p: "Guzman Cardeña", r: "GUCC651231L66", c: "15DTV0108P", d: "Telesecundaria", e: "dtv0108p.cjgc@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Gerardo", p: "Sánchez Solano", r: "SASG790215FX4", c: "15DTV0019W", d: "Telesecundarias", e: "dtv0019w.gss@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Sandra", p: "Zepeda Veloz", r: "ZEVS580114668", c: "15DTV0096A", d: "Telesecundaria", e: "dtv0096a.szv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "JOEL ENRIQUE", p: "VARGAS CORTES", r: "VACJ7207133B7", c: "15DTV0007R", d: "TELESECUNDARIA", e: "dtv0007r.jevc@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Rosa Lilia", p: "Vazquez", r: "VAZR721102A24", c: "15DTV0083X", d: "TELESECUNDARIA", e: "dtv0083xrlv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Pedro", p: "Neri Olea", r: "NEOP750629GQ9", c: "15DTV0187S", d: "Telesecundaria", e: "dtv00187s.pno@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Miguel Enrique", p: "Juarez Campos", r: "JUCM6810028B5", c: "DES0354T", d: "Generales", e: "des0354t.mejc@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Rodolfo Anibal", p: "Campos Vargas", r: "CAVR820714X9A", c: "15DTV0135M", d: "Telesecundaria", e: "dtv0135m.racv@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MARIA ISABEL ELENA", p: "LOPEZ CASTRO", r: "LOCI610330I19", c: "15DTV0003V", d: "TELESECUNDARIAS", e: "dtv0003v.mislc@desysa.edu.mx", f: "DIRECTORA" },
    { n: "ERIKA JANET", p: "MALDONADO HERNÁNDEZ", r: "MAHE780311K77", c: "DTV0208O", d: "TELESECUNDARIA", e: "Dtv0208o.ejmh@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Andrés", p: "López Pérez", r: "LOPA470520JY3", c: "15DTV0002W", d: "Telesecundarias", e: "dtv0002w.alp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Héctor", p: "Pacheco", r: "PAHE5409265Q4", c: "15DTV0061L", d: "Telesecundarias", e: "dtv0061l.hp@desysa.edu.mx", f: "DOCENTE" },
    { n: "DINA", p: "CUERVO MELGOZA", r: "CUMD700806IE5", c: "15DTV0033P", d: "TELESECUNDARIA", e: "dtv0033p.dcm@desysa.edu.mx", f: "DOCENTE" },
    { n: "JUDITH", p: "GOMEZ ROSALES", r: "GORJ720506JU7", c: "15DTV0155Z", d: "TELESECUNDARIAS", e: "dtv0155z.jgr@desysa.edu.mx", f: "DOCENTE" },
    { n: "Mirna", p: "Jonguitud Avila", r: "JOAM730820NQA", c: "15DTV0402S", d: "Telesecundarias", e: "dtv0402s.mja@desysa.edu.mx", f: "DIRECTORA" },
    { n: "LILIANA", p: "MUCIÑO JIMÉNEZ", r: "MUJL790430LF9", c: "15DTV0098Z", d: "TELESECUNDARIA", e: "dtv0098z.lmj@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Maria Cecilia", p: "Garcia Vivas", r: "GAVC621122MU5", c: "15DES0274H", d: "Generales", e: "des0274h.mcgv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Orlanda Magdalena", p: "Matias Salvador", r: "MASO621122PXA", c: "DES0317P", d: "Generales", e: "des0317p.omms@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Monica", p: "Rangel Alvarez", r: "RAAM740827CH2", c: "15DTV0015Z", d: "Telesecundarias", e: "dtv0015zmra@desysa.edu.mx", f: "DOCENTE" },
    { n: "Salvador", p: "Arguello Ramírez", r: "AURS630214H70", c: "DES0368W", d: "Generales", e: "des0368w.sar@desysa.edu.mx", f: "PREFECTO" },
    { n: "Aide", p: "Herrera Vázquez", r: "HEVA850722HJ3", c: "15DTV0385S", d: "Telesecundaria", e: "dtv0385s.ahv@desysa.edu.mx", f: "DOCENTE" },
    { n: "JUANA ARELI", p: "BARRERA HERNANDEZ", r: "BAHJ880319JU3", c: "15DES0349H", d: "Generales", e: "des0349h.jabh@coees.edu.mx", f: "INTENDENTE" },
    { n: "FELIPE", p: "CANO VAZQUEZ", r: "CAVF900707KT7", c: "15DES0349H", d: "Generales", e: "des0349h.fcv@coees.edu.mx", f: "ADMINISTRATIVO" },
    { n: "ABRAHAM", p: "CASTRO GACHUZ", r: "CAGX9103164V8", c: "15DES0349H", d: "Generales", e: "des0349h.acg@coees.edu.mx", f: "DOCENTE" },
    { n: "LAURA", p: "CEDILLO ROMO", r: "CERL911124RP5", c: "15DES0349H", d: "Generales", e: "des0349h.lcr@desysa.edu.mx", f: "DOCENTE" }
  ];

  const grouped: Record<string, any[]> = {};
  rawPeople.forEach(person => {
    const cctVal = person.c.toUpperCase();
    if (!grouped[cctVal]) grouped[cctVal] = [];
    grouped[cctVal].push({
      paterno: person.p.split(' ')[0] || '',
      materno: person.p.split(' ')[1] || '',
      nombres: person.n,
      rfc: person.r || 'RFC-PENDIENTE',
      funcion: person.f.toUpperCase(),
      email: person.e.toLowerCase(),
      cct: cctVal,
      nombreCT: `C.T. ${cctVal}`,
      municipio: person.d
    });
  });

  return Object.entries(grouped).map(([cct, users], i) => ({
    id: `ACC-Solicitud-${i + 100}`,
    name: 'Cuentas Institucionales',
    cct: cct,
    schoolName: `PLANTEL ${cct} - ${users[0].municipio}`,
    email: users[0].email,
    status: 'activo',
    date: '2026-02-15',
    progress: 100,
    asistentes: users,
    municipio: users[0].municipio
  }));
};

export const programsData: ProgramStatus[] = [
  ...getAccountsData(),
  { id: 'BD-001', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S', alumnosBeneficiados: 450, docentesBeneficiados: 25 },
  { id: 'GEO-001', name: 'Geoposición', cct: '15DTV0001X', longitud: '-99.146', latitud: '19.818', schoolName: 'Telesecundaria 1', status: 'activo', date: '2026-02-15', progress: 100 }
];

export const supportData: SupportTicket[] = [
  { id: 'S-001', cct: '15DES0065B', schoolName: 'DR. MANUEL SANDOVAL VALLARTA', status: 'atendido', tipoIncidencia: 'mantenimiento', fechaEntrada: '2024-05-20', valle: 'MEXICO', municipio: 'AMECAMECA', oficinaRegionalAtencion: 'Oficina de Tecnóloga Nezahualcóyotl', responsables: ['ING. CARLOS LÓPEZ'], tecnicos: 'ING. CARLOS LÓPEZ', serviciosMC: 0, serviciosMP: 12, numeroEquipos: 12 }
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
