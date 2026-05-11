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

// Base de datos de Cuentas Institucionales (231 registros)
const ciRaw = [
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "1", a: "PLANTEL", z: "4", e: "PES0007Q@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "2", a: "PLANTEL", z: "5", e: "PES0010D@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "3", a: "PLANTEL", z: "1", e: "PES0012B@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES", v: "MEXICO", u: "4", a: "PLANTEL", z: "33", e: "PES0013A@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "5", a: "PLANTEL", z: "33", e: "PES0014Z@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "6", a: "PLANTEL", z: "23", e: "PES0017X@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "7", a: "PLANTEL", z: "9", e: "PES0018W@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "8", a: "PLANTEL", z: "22", e: "PES0019V@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "9", a: "PLANTEL", z: "1", e: "PES0020K@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "10", a: "PLANTEL", z: "4", e: "PES0021J@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "11", a: "PLANTEL", z: "44", e: "PES0025F@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "12", a: "PLANTEL", z: "25", e: "PES0026E@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "13", a: "PLANTEL", z: "37", e: "PES0027D@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "14", a: "PLANTEL", z: "2", e: "PES0031Q@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "15", a: "PLANTEL", z: "1", e: "PES0032P@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "16", a: "PLANTEL", z: "2", e: "PES0034N@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "17", a: "PLANTEL", z: "24", e: "PES0035M@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "18", a: "PLANTEL", z: "1", e: "PES0036L@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "19", a: "PLANTEL", z: "14", e: "PES0037K@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "20", a: "PLANTEL", z: "6", e: "PES0038J@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "21", a: "PLANTEL", z: "40", e: "PES0051D@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "22", a: "PLANTEL", z: "43", e: "PES0059W@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "23", a: "PLANTEL", z: "3", e: "PES0060L@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "24", a: "PLANTEL", z: "3", e: "PES0061K@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "25", a: "PLANTEL", z: "15", e: "PES0062J@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "26", a: "PLANTEL", z: "24", e: "PES0063I@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "27", a: "PLANTEL", z: "26", e: "PES0064H@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "28", a: "PLANTEL", z: "37", e: "PES0065G@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "29", a: "PLANTEL", z: "31", e: "PES0066F@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "30", a: "PLANTEL", z: "11", e: "PES0068D@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "31", a: "PLANTEL", z: "43", e: "PES0069C@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "32", a: "PLANTEL", z: "25", e: "PES0070S@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "33", a: "PLANTEL", z: "1", e: "PES0076M@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "34", a: "PLANTEL", z: "34", e: "PES0084V@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "35", a: "PLANTEL", z: "3", e: "PES0085U@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "36", a: "PLANTEL", z: "39", e: "PES0086T@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "37", a: "PLANTEL", z: "17", e: "PES0087S@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "38", a: "PLANTEL", z: "22", e: "PES0096Z@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "39", a: "PLANTEL", z: "31", e: "PES0097Z@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "40", a: "PLANTEL", z: "38", e: "PES0098Y@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "41", a: "PLANTEL", z: "24", e: "PES0099X@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "42", a: "PLANTEL", z: "14", e: "PES0104S@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "43", a: "PLANTEL", z: "40", e: "PES0112A@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "44", a: "PLANTEL", z: "25", e: "PES0113Z@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "45", a: "PLANTEL", z: "26", e: "PES0115Y@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "46", a: "PLANTEL", z: "2", e: "PES0262H@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "47", a: "PLANTEL", z: "2", e: "PES0290D@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "48", a: "PLANTEL", z: "41", e: "PES0338G@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "49", a: "PLANTEL", z: "8", e: "PES0339F@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "50", a: "PLANTEL", z: "17", e: "PES0340V@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "51", a: "PLANTEL", z: "46", e: "PES0342T@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "52", a: "PLANTEL", z: "5", e: "PES0343S@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "53", a: "PLANTEL", z: "41", e: "PES0345Q@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "54", a: "PLANTEL", z: "9", e: "PES0347O@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "55", a: "PLANTEL", z: "4", e: "PES0348N@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "56", a: "PLANTEL", z: "1", e: "PES0413X@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "57", a: "PLANTEL", z: "8", e: "PES0415V@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "58", a: "PLANTEL", z: "16", e: "PES0437G@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "59", a: "PLANTEL", z: "41", e: "PES0439E@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "60", a: "PLANTEL", z: "13", e: "PES0441T@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "61", a: "PLANTEL", z: "32", e: "PES0445P@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "62", a: "PLANTEL", z: "22", e: "PES0508K@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "63", a: "PLANTEL", z: "19", e: "PES0547M@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "64", a: "PLANTEL", z: "2", e: "PES0548L@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "65", a: "PLANTEL", z: "6", e: "PES0550Z@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "66", a: "PLANTEL", z: "36", e: "PES0553X@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "67", a: "PLANTEL", z: "41", e: "PES0556U@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "68", a: "PLANTEL", z: "4", e: "PES0559R@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "69", a: "PLANTEL", z: "10", e: "PES0560G@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "70", a: "PLANTEL", z: "14", e: "PES0561F@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "71", a: "PLANTEL", z: "14", e: "PES0568Z@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "72", a: "PLANTEL", z: "36", e: "PES0586O@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "73", a: "PLANTEL", z: "9", e: "PES0604N@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "74", a: "PLANTEL", z: "40", e: "PES0605M@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "75", a: "PLANTEL", z: "1", e: "PES0606L@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "76", a: "PLANTEL", z: "36", e: "PES0618Q@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "77", a: "PLANTEL", z: "1", e: "PES0619P@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "78", a: "PLANTEL", z: "15", e: "PES0620E@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "79", a: "PLANTEL", z: "16", e: "PES0621D@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "80", a: "PLANTEL", z: "5", e: "PES0630L@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "81", a: "PLANTEL", z: "40", e: "PES0634H@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "82", a: "PLANTEL", z: "24", e: "PES0638D@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "83", a: "PLANTEL", z: "5", e: "PES0644O@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "84", a: "PLANTEL", z: "14", e: "PES0650Z@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "85", a: "PLANTEL", z: "14", e: "PES0655U@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "86", a: "PLANTEL", z: "15", e: "PES0663C@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "87", a: "PLANTEL", z: "17", e: "PES0683Q@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "88", a: "PLANTEL", z: "4", e: "PES1300A@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "89", a: "PLANTEL", z: "5", e: "PES1302Z@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "90", a: "PLANTEL", z: "11", e: "PES1304X@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "91", a: "PLANTEL", z: "10", e: "PES1305W@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "92", a: "PLANTEL", z: "18", e: "PES1306V@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "93", a: "PLANTEL", z: "36", e: "PES1307U@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "94", a: "PLANTEL", z: "4", e: "PES1311G@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "95", a: "PLANTEL", z: "32", e: "PES1312F@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "96", a: "PLANTEL", z: "18", e: "PES1313E@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "97", a: "PLANTEL", z: "16", e: "PES1315C@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "98", a: "PLANTEL", z: "10", e: "PES1317A@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "99", a: "PLANTEL", z: "8", e: "PES1318Z@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "100", a: "PLANTEL", z: "4", e: "PES1319Z@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "101", a: "PLANTEL", z: "46", e: "PES1320O@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "102", a: "PLANTEL", z: "11", e: "PES1321N@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "103", a: "PLANTEL", z: "9", e: "PES1322M@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "104", a: "PLANTEL", z: "15", e: "PES1323L@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "105", a: "PLANTEL", z: "38", e: "PES1325J@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "106", a: "PLANTEL", z: "5", e: "PES1326I@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "107", a: "PLANTEL", z: "36", e: "PES1328G@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "108", a: "PLANTEL", z: "14", e: "PES1330V@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "109", a: "PLANTEL", z: "47", e: "PES1331U@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "110", a: "PLANTEL", z: "18", e: "PES1332T@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "111", a: "PLANTEL", z: "45", e: "PES1333S@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "112", a: "PLANTEL", z: "15", e: "PES1335Q@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "113", a: "PLANTEL", z: "10", e: "PES1336P@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "114", a: "PLANTEL", z: "47", e: "PES1337O@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "115", a: "PLANTEL", z: "39", e: "PES1338N@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "116", a: "PLANTEL", z: "10", e: "PES1339M@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "117", a: "PLANTEL", z: "42", e: "PES1341A@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "118", a: "PLANTEL", z: "7", e: "PES1342Z@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "119", a: "PLANTEL", z: "22", e: "PES1343Z@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "120", a: "PLANTEL", z: "6", e: "PES1345X@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "121", a: "PLANTEL", z: "18", e: "PES1346W@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "122", a: "PLANTEL", z: "6", e: "PES1348U@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "123", a: "PLANTEL", z: "14", e: "PES1349T@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "124", a: "PLANTEL", z: "4", e: "PES1350I@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "125", a: "PLANTEL", z: "19", e: "PES1351H@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "126", a: "PLANTEL", z: "19", e: "PES1352G@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "127", a: "PLANTEL", z: "38", e: "PES1355D@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "128", a: "PLANTEL", z: "14", e: "PES1356C@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES", v: "MEXICO", u: "129", a: "PLANTEL", z: "5", e: "PES1357B@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "130", a: "PLANTEL", z: "26", e: "PES1359Z@desysa.gob.mx", st: "APROBADO" },
  { s: "8", mod: "PES GOB", v: "TOLUCA", u: "131", a: "PLANTEL", z: "29", e: "PES1360P@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "132", a: "PLANTEL", z: "14", e: "PES1361O@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "133", a: "PLANTEL", z: "23", e: "PES1363M@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "134", a: "PLANTEL", z: "14", e: "PES1364L@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES GOB", v: "TOLUCA", u: "135", a: "PLANTEL", z: "34", e: "PES1365K@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "136", a: "PLANTEL", z: "17", e: "PES1368H@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "137", a: "PLANTEL", z: "37", e: "PES1369G@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "138", a: "PLANTEL", z: "15", e: "PES1370W@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "139", a: "PLANTEL", z: "32", e: "PES1371V@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "140", a: "PLANTEL", z: "3", e: "PES1372U@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "141", a: "PLANTEL", z: "46", e: "PES1373T@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "142", a: "PLANTEL", z: "42", e: "PES1377P@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "143", a: "PLANTEL", z: "19", e: "PES1378O@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "144", a: "PLANTEL", z: "43", e: "PES1380C@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "145", a: "PLANTEL", z: "11", e: "PES1381B@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "146", a: "PLANTEL", z: "7", e: "PES1382A@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "147", a: "PLANTEL", z: "22", e: "PES1384Z@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "148", a: "PLANTEL", z: "17", e: "PES1386X@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "149", a: "PLANTEL", z: "37", e: "PES1387W@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "150", a: "PLANTEL", z: "21", e: "PES1389U@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "151", a: "PLANTEL", z: "38", e: "PES1392H@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "152", a: "PLANTEL", z: "34", e: "PES1393G@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "153", a: "PLANTEL", z: "9", e: "PES1394F@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "154", a: "PLANTEL", z: "15", e: "PES1395E@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "155", a: "PLANTEL", z: "6", e: "PES1396D@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "156", a: "PLANTEL", z: "14", e: "PES1398B@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "157", a: "PLANTEL", z: "41", e: "PES1399A@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "158", a: "PLANTEL", z: "10", e: "PES1400Z@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "159", a: "PLANTEL", z: "24", e: "PES1401Z@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "160", a: "PLANTEL", z: "25", e: "PES1402Y@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "161", a: "PLANTEL", z: "24", e: "PES1403X@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "162", a: "PLANTEL", z: "11", e: "PES1406U@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "163", a: "PLANTEL", z: "36", e: "PES1407T@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "164", a: "PLANTEL", z: "25", e: "PES1408S@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "165", a: "PLANTEL", z: "12", e: "PES1409R@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "166", a: "PLANTEL", z: "9", e: "PES1411F@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "167", a: "PLANTEL", z: "40", e: "PES1412E@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "168", a: "PLANTEL", z: "47", e: "PES1413D@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES GOB", v: "TOLUCA", u: "169", a: "PLANTEL", z: "34", e: "PES1414C@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "170", a: "PLANTEL", z: "14", e: "PES1419Y@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "171", a: "PLANTEL", z: "22", e: "PES1421M@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "172", a: "PLANTEL", z: "10", e: "PES1422L@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "173", a: "PLANTEL", z: "34", e: "PES1423K@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "174", a: "PLANTEL", z: "12", e: "PES1424J@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "175", a: "PLANTEL", z: "26", e: "PES1425I@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "176", a: "PLANTEL", z: "8", e: "PES1426H@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "177", a: "PLANTEL", z: "36", e: "PES1427G@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "178", a: "PLANTEL", z: "42", e: "PES1428F@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES GOB", v: "MEXICO", u: "179", a: "PLANTEL", z: "40", e: "PES1429E@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "180", a: "PLANTEL", z: "7", e: "PES1430U@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "181", a: "PLANTEL", z: "8", e: "PES1431T@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "182", a: "PLANTEL", z: "19", e: "PES1432S@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES GOB", v: "MEXICO", u: "183", a: "PLANTEL", z: "20", e: "PES1433R@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "184", a: "PLANTEL", z: "9", e: "PES1435P@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "185", a: "PLANTEL", z: "18", e: "PES1436O@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES", v: "TOLUCA", u: "186", a: "PLANTEL", z: "26", e: "PES1437N@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "187", a: "PLANTEL", z: "7", e: "PES1438M@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "188", a: "PLANTEL", z: "23", e: "PES1440A@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "189", a: "PLANTEL", z: "24", e: "PES1441Z@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "190", a: "PLANTEL", z: "45", e: "PES1442Z@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "191", a: "PLANTEL", z: "44", e: "PES1443Y@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES GOB", v: "TOLUCA", u: "192", a: "PLANTEL", z: "39", e: "PES1444X@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "193", a: "PLANTEL", z: "17", e: "PES1445W@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "194", a: "PLANTEL", z: "46", e: "PES1446V@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "195", a: "PLANTEL", z: "8", e: "PES1447U@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "196", a: "PLANTEL", z: "11", e: "PES1448T@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "197", a: "PLANTEL", z: "12", e: "PES1449S@desysa.gob.mx", st: "APROBADO" },
  { s: "7", mod: "PES", v: "TOLUCA", u: "198", a: "PLANTEL", z: "34", e: "PES1450H@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "199", a: "PLANTEL", z: "14", e: "PES1451G@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "200", a: "PLANTEL", z: "14", e: "PES1452F@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "201", a: "PLANTEL", z: "42", e: "PES1453E@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "202", a: "PLANTEL", z: "24", e: "PES1455C@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "203", a: "PLANTEL", z: "47", e: "PES1456B@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "204", a: "PLANTEL", z: "31", e: "PES1457A@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "205", a: "PLANTEL", z: "23", e: "PES1458Z@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "206", a: "PLANTEL", z: "37", e: "PES1459Z@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES", v: "MEXICO", u: "207", a: "PLANTEL", z: "12", e: "PES1461N@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "208", a: "PLANTEL", z: "45", e: "PES1462M@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES", v: "MEXICO", u: "209", a: "PLANTEL", z: "22", e: "PES1464K@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "210", a: "PLANTEL", z: "15", e: "PES1465J@desysa.gob.mx", st: "APROBADO" },
  { s: "6", mod: "PES GOB", v: "TOLUCA", u: "211", a: "PLANTEL", z: "38", e: "PES1466I@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "212", a: "PLANTEL", z: "41", e: "PES1467H@desysa.gob.mx", st: "APROBADO" },
  { s: "9", mod: "PES GOB", v: "MEXICO", u: "213", a: "PLANTEL", z: "24", e: "PES1468G@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "214", a: "PLANTEL", z: "36", e: "PES1469F@desysa.gob.mx", st: "APROBADO" },
  { s: "2", mod: "PES", v: "MEXICO", u: "215", a: "PLANTEL", z: "8", e: "PES1470V@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES GOB", v: "MEXICO", u: "216", a: "PLANTEL", z: "14", e: "PES1471U@desysa.gob.mx", st: "APROBADO" },
  { s: "3", mod: "PES GOB", v: "MEXICO", u: "217", a: "PLANTEL", z: "10", e: "PES1472T@desysa.gob.mx", st: "APROBADO" },
  { s: "5", mod: "PES", v: "MEXICO", u: "218", a: "PLANTEL", z: "20", e: "PES1473S@desysa.gob.mx", st: "APROBADO" },
  { s: "1", mod: "PES GOB", v: "MEXICO", u: "219", a: "PLANTEL", z: "5", e: "PES1474R@desysa.gob.mx", st: "APROBADO" },
  { s: "4", mod: "PES", v: "MEXICO", u: "220", a: "PLANTEL", z: "32", e: "PES1477O@desysa.gob.mx", st: "APROBADO" },
  { s: "8", mod: "PST GOB", v: "MEXICO", u: "221", a: "PLANTEL", z: "21", e: "PST0001O@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "2", mod: "PST GOB", v: "TOLUCA", u: "222", a: "PLANTEL", z: "31", e: "PST0006J@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "6", mod: "PST", v: "MEXICO", u: "223", a: "PLANTEL", z: "29", e: "PST0013T@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "4", mod: "PST", v: "MEXICO", u: "224", a: "PLANTEL", z: "10", e: "PST0014S@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "4", mod: "PST", v: "MEXICO", u: "225", a: "PLANTEL", z: "33", e: "PST0021B@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "9", mod: "PST GOB", v: "TOLUCA", u: "226", a: "PLANTEL", z: "5", e: "PST0036D@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "5", mod: "PST GOB", v: "MEXICO", u: "227", a: "PLANTEL", z: "18", e: "PST0038B@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "6", mod: "PST", v: "MEXICO", u: "228", a: "PLANTEL", z: "16", e: "PST0052V@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "6", mod: "PST", v: "MEXICO", u: "229", a: "PLANTEL", z: "14", e: "PST0600J@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "8", mod: "PST", v: "MEXICO", u: "230", a: "PLANTEL", z: "23", e: "PST0601I@desysa.gob.mx", st: "DESAPROBADO" },
  { s: "8", mod: "PST", v: "MEXICO", u: "231", a: "PLANTEL", z: "23", e: "PST0602H@desysa.gob.mx", st: "DESAPROBADO" },
];

export const programsData: ProgramStatus[] = [
  { id: 'PROG-BD', name: 'Biblioteca Digital', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-GP', name: 'Geoposición', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-CE', name: 'Conoce mi Escuela', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-MA', name: 'Mesa de Ayuda Técnica', progress: 0, status: 'planeacion', date: '2025-05-22' },
  ...ciRaw.map((r, i) => ({
    id: `PROG-CI-${i + 1}`,
    name: 'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
    status: r.st === 'APROBADO' ? 'concluido' : 'planeacion',
    date: '2025-05-22',
    cct: r.e.split('@')[0].length === 8 ? `15${r.e.split('@')[0]}` : r.e.split('@')[0],
    valle: r.v,
    modalidad: r.mod,
    sector: r.s,
    zonaEscolar: r.z,
    asistentes: [{
      nombres: `RESPONSABLE ${r.e.split('@')[0]}`,
      paterno: '',
      materno: '',
      rfc: '',
      genero: '',
      funcion: 'RESPONSABLE',
      email: r.e,
      cct: r.e.split('@')[0].length === 8 ? `15${r.e.split('@')[0]}` : r.e.split('@')[0],
      nombreCT: `ESCUELA ${r.e.split('@')[0]}`,
      ze: r.z,
      sector: r.s,
      modalidad: r.mod,
      municipio: 'MUNICIPIO PENDIENTE',
      region: r.v,
      valle: r.v,
      departamento: r.a
    }] as ProgramAssistant[]
  } as ProgramStatus))
];
