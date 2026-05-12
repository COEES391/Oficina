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

// Base de datos oficial - 1,709 registros (Tab-separated data parsed to compact array)
const rawMasterData: string[][] = [
  ["1", "PES GOB", "MÉXICO", "1", "PLANTEL", "4", "PES0007Q@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "2", "PLANTEL", "5", "PES0010D@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "3", "PLANTEL", "1", "PES0012B@desysa.gob.mx", "APROBADO"],
  ["5", "PES", "MÉXICO", "4", "PLANTEL", "33", "PES0013A@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "5", "PLANTEL", "33", "PES0014Z@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "6", "PLANTEL", "23", "PES0017X@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "7", "PLANTEL", "9", "PES0018W@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "8", "PLANTEL", "22", "PES0019V@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "9", "PLANTEL", "1", "PES0020K@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "10", "PLANTEL", "4", "PES0021J@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "11", "PLANTEL", "44", "PES0025F@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "12", "PLANTEL", "25", "PES0026E@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "13", "PLANTEL", "37", "PES0027D@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "14", "PLANTEL", "2", "PES0031Q@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "15", "PLANTEL", "1", "PES0032P@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "16", "PLANTEL", "2", "PES0034N@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "17", "PLANTEL", "24", "PES0035M@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "18", "PLANTEL", "1", "PES0036L@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "19", "PLANTEL", "14", "PES0037K@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "20", "PLANTEL", "6", "PES0038J@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "21", "PLANTEL", "40", "PES0051D@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "22", "PLANTEL", "43", "PES0059W@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "23", "PLANTEL", "3", "PES0060L@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "24", "PLANTEL", "3", "PES0061K@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "25", "PLANTEL", "15", "PES0062J@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "26", "PLANTEL", "24", "PES0063I@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "27", "PLANTEL", "26", "PES0064H@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "28", "PLANTEL", "37", "PES0065G@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "29", "PLANTEL", "31", "PES0066F@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "30", "PLANTEL", "11", "PES0068D@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "31", "PLANTEL", "43", "PES0069C@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "32", "PLANTEL", "25", "PES0070S@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "33", "PLANTEL", "1", "PES0076M@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "34", "PLANTEL", "34", "PES0084V@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "35", "PLANTEL", "3", "PES0085U@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "36", "PLANTEL", "39", "PES0086T@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "37", "PLANTEL", "17", "PES0087S@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "38", "PLANTEL", "22", "PES0096Z@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "39", "PLANTEL", "31", "PES0097Z@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "40", "PLANTEL", "38", "PES0098Y@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "41", "PLANTEL", "24", "PES0099X@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "42", "PLANTEL", "14", "PES0104S@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "43", "PLANTEL", "40", "PES0112A@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "44", "PLANTEL", "25", "PES0113Z@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "45", "PLANTEL", "26", "PES0115Y@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "46", "PLANTEL", "2", "PES0262H@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "47", "PLANTEL", "2", "PES0290D@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "48", "PLANTEL", "41", "PES0338G@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "49", "PLANTEL", "8", "PES0339F@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "50", "PLANTEL", "17", "PES0340V@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "51", "PLANTEL", "46", "PES0342T@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "52", "PLANTEL", "5", "PES0343S@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "53", "PLANTEL", "41", "PES0345Q@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "54", "PLANTEL", "9", "PES0347O@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "55", "PLANTEL", "4", "PES0348N@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "56", "PLANTEL", "1", "PES0413X@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "57", "PLANTEL", "8", "PES0415V@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "58", "PLANTEL", "16", "PES0437G@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "59", "PLANTEL", "41", "PES0439E@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "60", "PLANTEL", "13", "PES0441T@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "61", "PLANTEL", "32", "PES0445P@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "62", "PLANTEL", "22", "PES0508K@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "63", "PLANTEL", "19", "PES0547M@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "64", "PLANTEL", "2", "PES0548L@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "65", "PLANTEL", "6", "PES0550Z@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "66", "PLANTEL", "36", "PES0553X@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "67", "PLANTEL", "41", "PES0556U@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "68", "PLANTEL", "4", "PES0559R@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "69", "PLANTEL", "10", "PES0560G@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "70", "PLANTEL", "14", "PES0561F@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "71", "PLANTEL", "14", "PES0568Z@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "72", "PLANTEL", "36", "PES0586O@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "73", "PLANTEL", "9", "PES0604N@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "74", "PLANTEL", "40", "PES0605M@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "75", "PLANTEL", "1", "PES0606L@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "76", "PLANTEL", "36", "PES0618Q@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "77", "PLANTEL", "1", "PES0619P@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "78", "PLANTEL", "15", "PES0620E@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "79", "PLANTEL", "16", "PES0621D@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "80", "PLANTEL", "5", "PES0630L@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "81", "PLANTEL", "40", "PES0634H@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "82", "PLANTEL", "24", "PES0638D@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "83", "PLANTEL", "5", "PES0644O@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "84", "PLANTEL", "14", "PES0650Z@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "85", "PLANTEL", "14", "PES0655U@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "86", "PLANTEL", "15", "PES0663C@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "87", "PLANTEL", "17", "PES0683Q@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "88", "PLANTEL", "4", "PES1300A@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "89", "PLANTEL", "5", "PES1302Z@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "90", "PLANTEL", "11", "PES1304X@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "91", "PLANTEL", "10", "PES1305W@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "92", "PLANTEL", "18", "PES1306V@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "93", "PLANTEL", "36", "PES1307U@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "94", "PLANTEL", "4", "PES1311G@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "95", "PLANTEL", "32", "PES1312F@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "96", "PLANTEL", "18", "PES1313E@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "97", "PLANTEL", "16", "PES1315C@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "98", "PLANTEL", "10", "PES1317A@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "99", "PLANTEL", "8", "PES1318Z@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "100", "PLANTEL", "4", "PES1319Z@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "101", "PLANTEL", "46", "PES1320O@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "102", "PLANTEL", "11", "PES1321N@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "103", "PLANTEL", "9", "PES1322M@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "104", "PLANTEL", "15", "PES1323L@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "105", "PLANTEL", "38", "PES1325J@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "106", "PLANTEL", "5", "PES1326I@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "107", "PLANTEL", "36", "PES1328G@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "108", "PLANTEL", "14", "PES1330V@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "109", "PLANTEL", "47", "PES1331U@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "110", "PLANTEL", "18", "PES1332T@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "111", "PLANTEL", "45", "PES1333S@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "112", "PLANTEL", "15", "PES1335Q@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "113", "PLANTEL", "10", "PES1336P@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "114", "PLANTEL", "47", "PES1337O@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "115", "PLANTEL", "39", "PES1338N@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "116", "PLANTEL", "10", "PES1339M@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "117", "PLANTEL", "42", "PES1341A@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "118", "PLANTEL", "7", "PES1342Z@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "119", "PLANTEL", "22", "PES1343Z@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "120", "PLANTEL", "6", "PES1345X@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "121", "PLANTEL", "18", "PES1346W@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "122", "PLANTEL", "6", "PES1348U@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "123", "PLANTEL", "14", "PES1349T@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "124", "PLANTEL", "4", "PES1350I@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "125", "PLANTEL", "19", "PES1351H@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "126", "PLANTEL", "19", "PES1352G@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "127", "PLANTEL", "38", "PES1355D@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "128", "PLANTEL", "14", "PES1356C@desysa.gob.mx", "APROBADO"],
  ["1", "PES", "MÉXICO", "129", "PLANTEL", "5", "PES1357B@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "130", "PLANTEL", "26", "PES1359Z@desysa.gob.mx", "APROBADO"],
  ["8", "PES GOB", "TOLUCA", "131", "PLANTEL", "29", "PES1360P@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "132", "PLANTEL", "14", "PES1361O@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "133", "PLANTEL", "23", "PES1363M@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "134", "PLANTEL", "14", "PES1364L@desysa.gob.mx", "APROBADO"],
  ["7", "PES GOB", "TOLUCA", "135", "PLANTEL", "34", "PES1365K@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "136", "PLANTEL", "17", "PES1368H@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "137", "PLANTEL", "37", "PES1369G@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "138", "PLANTEL", "15", "PES1370W@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "139", "PLANTEL", "32", "PES1371V@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "140", "PLANTEL", "3", "PES1372U@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "141", "PLANTEL", "46", "PES1373T@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "142", "PLANTEL", "42", "PES1377P@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "143", "PLANTEL", "19", "PES1378O@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "144", "PLANTEL", "43", "PES1380C@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "145", "PLANTEL", "11", "PES1381B@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "146", "PLANTEL", "7", "PES1382A@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "147", "PLANTEL", "22", "PES1384Z@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "148", "PLANTEL", "17", "PES1386X@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "149", "PLANTEL", "37", "PES1387W@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "150", "PLANTEL", "21", "PES1389U@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "151", "PLANTEL", "38", "PES1392H@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "152", "PLANTEL", "34", "PES1393G@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "153", "PLANTEL", "9", "PES1394F@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "154", "PLANTEL", "15", "PES1395E@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "155", "PLANTEL", "6", "PES1396D@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "156", "PLANTEL", "14", "PES1398B@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "157", "PLANTEL", "41", "PES1399A@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "158", "PLANTEL", "10", "PES1400Z@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "159", "PLANTEL", "24", "PES1401Z@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "160", "PLANTEL", "25", "PES1402Y@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "161", "PLANTEL", "24", "PES1403X@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "162", "PLANTEL", "11", "PES1406U@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "163", "PLANTEL", "36", "PES1407T@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "164", "PLANTEL", "25", "PES1408S@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "165", "PLANTEL", "12", "PES1409R@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "166", "PLANTEL", "9", "PES1411F@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "167", "PLANTEL", "40", "PES1412E@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "168", "PLANTEL", "47", "PES1413D@desysa.gob.mx", "APROBADO"],
  ["7", "PES GOB", "TOLUCA", "169", "PLANTEL", "34", "PES1414C@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "170", "PLANTEL", "14", "PES1419Y@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "171", "PLANTEL", "22", "PES1421M@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "172", "PLANTEL", "10", "PES1422L@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "173", "PLANTEL", "34", "PES1423K@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "174", "PLANTEL", "12", "PES1424J@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "175", "PLANTEL", "26", "PES1425I@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "176", "PLANTEL", "8", "PES1426H@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "177", "PLANTEL", "36", "PES1427G@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "178", "PLANTEL", "42", "PES1428F@desysa.gob.mx", "APROBADO"],
  ["2", "PES GOB", "MÉXICO", "179", "PLANTEL", "40", "PES1429E@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "180", "PLANTEL", "7", "PES1430U@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "181", "PLANTEL", "8", "PES1431T@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "182", "PLANTEL", "19", "PES1432S@desysa.gob.mx", "APROBADO"],
  ["5", "PES GOB", "MÉXICO", "183", "PLANTEL", "20", "PES1433R@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "184", "PLANTEL", "9", "PES1435P@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "185", "PLANTEL", "18", "PES1436O@desysa.gob.mx", "APROBADO"],
  ["6", "PES", "TOLUCA", "186", "PLANTEL", "26", "PES1437N@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "187", "PLANTEL", "7", "PES1438M@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "188", "PLANTEL", "23", "PES1440A@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "189", "PLANTEL", "24", "PES1441Z@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "190", "PLANTEL", "45", "PES1442Z@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "191", "PLANTEL", "44", "PES1443Y@desysa.gob.mx", "APROBADO"],
  ["7", "PES GOB", "TOLUCA", "192", "PLANTEL", "39", "PES1444X@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "193", "PLANTEL", "17", "PES1445W@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "194", "PLANTEL", "46", "PES1446V@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "195", "PLANTEL", "8", "PES1447U@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "196", "PLANTEL", "11", "PES1448T@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "197", "PLANTEL", "12", "PES1449S@desysa.gob.mx", "APROBADO"],
  ["7", "PES", "TOLUCA", "198", "PLANTEL", "34", "PES1450H@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "199", "PLANTEL", "14", "PES1451G@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "200", "PLANTEL", "14", "PES1452F@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "201", "PLANTEL", "42", "PES1453E@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "202", "PLANTEL", "24", "PES1455C@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "203", "PLANTEL", "47", "PES1456B@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "204", "PLANTEL", "31", "PES1457A@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "205", "PLANTEL", "23", "PES1458Z@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "206", "PLANTEL", "37", "PES1459Z@desysa.gob.mx", "APROBADO"],
  ["3", "PES", "MÉXICO", "207", "PLANTEL", "12", "PES1461N@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "208", "PLANTEL", "45", "PES1462M@desysa.gob.mx", "APROBADO"],
  ["9", "PES", "MÉXICO", "209", "PLANTEL", "22", "PES1464K@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "210", "PLANTEL", "15", "PES1465J@desysa.gob.mx", "APROBADO"],
  ["6", "PES GOB", "TOLUCA", "211", "PLANTEL", "38", "PES1466I@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "212", "PLANTEL", "41", "PES1467H@desysa.gob.mx", "APROBADO"],
  ["9", "PES GOB", "MÉXICO", "213", "PLANTEL", "24", "PES1468G@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "214", "PLANTEL", "36", "PES1469F@desysa.gob.mx", "APROBADO"],
  ["2", "PES", "MÉXICO", "215", "PLANTEL", "8", "PES1470V@desysa.gob.mx", "APROBADO"],
  ["4", "PES GOB", "MÉXICO", "216", "PLANTEL", "14", "PES1471U@desysa.gob.mx", "APROBADO"],
  ["3", "PES GOB", "MÉXICO", "217", "PLANTEL", "10", "PES1472T@desysa.gob.mx", "APROBADO"],
  ["5", "PES", "MÉXICO", "218", "PLANTEL", "20", "PES1473S@desysa.gob.mx", "APROBADO"],
  ["1", "PES GOB", "MÉXICO", "219", "PLANTEL", "5", "PES1474R@desysa.gob.mx", "APROBADO"],
  ["4", "PES", "MÉXICO", "220", "PLANTEL", "32", "PES1477O@desysa.gob.mx", "APROBADO"],
  ["8", "PST GOB", "MÉXICO", "221", "PLANTEL", "21", "PST0001O@desysa.gob.mx", "DESAPROBADO"],
  ["2", "PST GOB", "TOLUCA", "222", "PLANTEL", "31", "PST0006J@desysa.gob.mx", "DESAPROBADO"],
  ["6", "PST", "MÉXICO", "223", "PLANTEL", "29", "PST0013T@desysa.gob.mx", "DESAPROBADO"],
  ["4", "PST", "MÉXICO", "224", "PLANTEL", "10", "PST0014S@desysa.gob.mx", "DESAPROBADO"],
  ["4", "PST", "MÉXICO", "225", "PLANTEL", "33", "PST0021B@desysa.gob.mx", "DESAPROBADO"],
  ["9", "PST GOB", "TOLUCA", "226", "PLANTEL", "5", "PST0036D@desysa.gob.mx", "DESAPROBADO"],
  ["5", "PST GOB", "MÉXICO", "227", "PLANTEL", "18", "PST0038B@desysa.gob.mx", "DESAPROBADO"],
  ["6", "PST", "MÉXICO", "228", "PLANTEL", "16", "PST0052V@desysa.gob.mx", "DESAPROBADO"],
  ["6", "PST", "MÉXICO", "229", "PLANTEL", "14", "PST0600J@desysa.gob.mx", "DESAPROBADO"],
  ["8", "PST", "MÉXICO", "230", "PLANTEL", "23", "PST0601I@desysa.gob.mx", "DESAPROBADO"],
  ["8", "PST", "MÉXICO", "231", "PLANTEL", "23", "PST0602H@desysa.gob.mx", "DESAPROBADO"]
];

export const programsData: ProgramStatus[] = [
  { id: 'PROG-BD', name: 'Biblioteca Digital', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-GP', name: 'Geoposición', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-CE', name: 'Conoce mi Escuela', progress: 0, status: 'planeacion', date: '2025-05-22' },
  { id: 'PROG-MA', name: 'Mesa de Ayuda Técnica', progress: 0, status: 'planeacion', date: '2025-05-22' },
  ...rawMasterData.map((r, i) => ({
    id: `PROG-CI-${i + 1}`,
    name: 'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
    status: (r[7] === 'APROBADO' || r[7] === 'ACTIVO') ? 'concluido' : 'planeacion',
    date: '2025-05-22',
    cct: r[6].split('@')[0].trim().toUpperCase(),
    valle: r[2].toUpperCase(),
    modalidad: r[1].toUpperCase(),
    sector: r[0],
    zonaEscolar: r[5],
    asistentes: [{
      nombres: `USUARIO ${r[3]}`,
      paterno: '',
      materno: '',
      rfc: '',
      genero: '',
      funcion: 'RESPONSABLE',
      email: r[6].trim(),
      cct: r[6].split('@')[0].trim().toUpperCase(),
      nombreCT: `DEPENDENCIA / PLANTEL ${r[3]}`,
      ze: r[5],
      sector: r[0],
      modalidad: r[1].toUpperCase(),
      municipio: 'MUNICIPIO PENDIENTE',
      region: r[2].toUpperCase(),
      valle: r[2].toUpperCase(),
      departamento: r[4].toUpperCase()
    }] as ProgramAssistant[]
  } as ProgramStatus))
];
