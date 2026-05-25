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
  // Campos Mantenimiento Detallado
  mantenimientoDetalle?: {
    equipoTecnologico: 'HDT' | 'EQUIPO DE COMPUTO' | 'OTRO' | '';
    equipoTecnologicoOtro?: string;
    equipos: Array<{ equipo: string; marca: string; serie: string; censal: string }>;
    fallaIdentificada: string;
    servicioRealizado: string;
  };
  // Campos RED Edusat Avanzado (Nuevo Formato)
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
  // Campos especializados para Teleplanteles
  numDecodificadores?: number;
  numSerie?: string;
  estatusSeñal?: 'débil' | 'estable' | 'excelente' | '';
  contratoFile?: string;
  numReportes?: number;
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
  // Campos Mantenimiento Detallado
  mantenimientoDetalle?: {
    equipoTecnologico: 'HDT' | 'EQUIPO DE COMPUTO' | 'OTRO' | '';
    equipoTecnologicoOtro?: string;
    equipos: Array<{ equipo: string; marca: string; serie: string; censal: string }>;
    fallaIdentificada: string;
    servicioRealizado: string;
  };
  // Campos RED Edusat Avanzado (Nuevo Formato)
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
  const rawAccounts = [
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
    { n: "NORMA ANGELICA", p: "DIAZ SALAS", r: "DISN6803277W4", c: "15FIS0023X", d: "Generales", e: "fis0023x.nads@desysa.edu.mx", f: "ADMINISTRATIVO" },
    { n: "ISIDRO CONSTANTINO", p: "TORRES GONZALEZ", r: "TOGI500515AS6", c: "15FIS0023X", d: "Generales", e: "fis0023x.ictg@desysa.edu.mx", f: "SUPERVISOR" },
    { n: "Rolando", p: "Solano Ramírez", r: "SORR521120365", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.rsr@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Álvaro", p: "López Saldaña", r: "LOSA850322MK8", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.als@desysa.edu.mx", f: "DOCENTE" },
    { n: "Karla Patricia", p: "Arreola Gutierrez", r: "AEGK8007232L0", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.kpag@desysa.edu.mx", f: "DOCENTE" },
    { n: "Fátima Araceli", p: "Castro Arriaga", r: "CAAF761022468", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.faca@desysa.edu.mx", f: "DOCENTE" },
    { n: "Levi Helem", p: "Morales Godinez", r: "MOGL890819EH6", c: "15DTV0118W", d: "Telesecundarias", e: "dtv0118w.lhmg@desysa.edu.mx", f: "DOCENTE" },
    { n: "Ruth", p: "Cadenas Pliego", r: "CAPR480112V18", c: "15DES0236E", d: "Generales", e: "des0236e.rcp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Korinna Erika", p: "Cardénas Rojas", r: "CARK800902BI3", c: "15DES0236E", d: "Generales", e: "des0236e.kecr@desysa.edu.mx", f: "DOCENTE" },
    { n: "Alma Rosa", p: "Camacho Guzmán", r: "CAGX921116E14", c: "15DES0236E", d: "Generales", e: "des0236e.arcg@desysa.edu.mx", f: "DOCENTE" },
    { n: "Cesar", p: "Aguilar Marcos", r: "AUMC7210231G5", c: "15DTV0022J", d: "Telesecundarias", e: "dtv0022jcam@desysa.edu.mx", f: "DOCENTE" },
    { n: "Raul", p: "Garcia Lopez", r: "GALR910830RU7", c: "15DTV0094C", d: "Telesecundarias", e: "dtv0094c.rgl@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MARCO ANTONIO", p: "HERNANDEZ GALLARDO", r: "HEGM4805249S8", c: "15DTV0006S", d: "Telesecundarias", e: "dtv0006smahg@desysa.edu.mx", f: "DIRECTOR" },
    { n: "HELISHEVA DEL CONSUELO", p: "CONTRERAS SÁNCHEZ", r: "COSH830210GX3", c: "15DTV0006S", d: "Telesecundarias", e: "dtv0006shccs@desysa.edu.mx", f: "SUBDIRECTORA" },
    { n: "Martha Imelda", p: "Ramirez Quiroz", r: "RAQM570512TF0", c: "15FTS0002G", d: "Telesecundarias", e: "fts0002gmirq@desysa.edu.mx", f: "JEFA DE SECTOR" },
    { n: "Victor Hugo", p: "Miranda Rosas", r: "MIRV640913FE4", c: "15DTV0032Q", d: "Telesecundarias", e: "dtv0032qvhmr@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Alberto", p: "Hernández Hernández", r: "HEHA7203182P1", c: "15DTV0110D", d: "Telesecundarias", e: "fts0003fahh@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Adelaido", p: "Azpeitia Hernandez", r: "AEHA701116MA5", c: "15DTV0123H", d: "Telesecundarias", e: "dtv0123h.aah@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Hector Alejandro", p: "Rodriguez Gonzalez", r: "ROGH8105131G5", c: "15DES0046N", d: "Generales", e: "des0046n.hrg@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Elizander", p: "Dominguez Peña", r: "DOPE700225KW7", c: "15DTV0271Q", d: "Telesecundarias", e: "dtv0271q.edp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Catalina Juana", p: "Guzman Cardeña", r: "GUCC651231L66", c: "15DTV0108P", d: "Telesecundarias", e: "dtv0108p.cjgc@desysa.edu.mx", f: "DIRECTIVA" },
    { n: "Gerardo", p: "Sánchez Solano", r: "SASG790215FX4", c: "15DTV0019W", d: "Telesecundarias", e: "dtv0019w.gss@desysa.edu.mx", f: "DIRECTOR" },
    { n: "JAVIER", p: "RODRIGUEZ GUTIERREZ", r: "ROGJ6505193P9", c: "15DTV0111C", d: "Telesecundarias", e: "dtv0111c.jrg@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Sandra", p: "Zepeda Veloz", r: "ZEVS580114668", c: "15DTV0096A", d: "Telesecundarias", e: "dtv0096a.szv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "JOEL ENRIQUE", p: "VARGAS CORTES", r: "VACJ7207133B7", c: "15DTV0007R", d: "Telesecundarias", e: "dtv0007r.jevc@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Rosa Lilia", p: "Vazquez", r: "VAVA700101XXX", c: "15DTV0083X", d: "Telesecundarias", e: "dtv0083xrlv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Pedro", p: "Neri Olea", r: "NEOP750629GQ9", c: "15DTV0187S", d: "Telesecundarias", e: "dtv00187s.pno@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Miguel Enrique", p: "Juarez Campos", r: "JUCM6810028B5", c: "DES0354T", d: "Generales", e: "des0354t.mejc@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Rodolfo Anibal", p: "Campos Vargas", r: "CAVR700101XXX", c: "15DTV0135M", d: "Telesecundarias", e: "dtv0135m.racv@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MARIA ISABEL ELENA", p: "LOPEZ CASTRO", r: "LOCI610330I19", c: "15DTV0003V", d: "Telesecundarias", e: "dtv0003v.mislc@desysa.edu.mx", f: "DIRECTORA" },
    { n: "ERIKA JANET", p: "MALDONADO HERNÁNDEZ", r: "MAHE780311K77", c: "15DTV0208O", d: "Telesecundarias", e: "Dtv0208o.ejmh@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Andrés", p: "López Pérez", r: "LOPA470520JY3", c: "15DTV0002W", d: "Telesecundarias", e: "dtv0002w.alp@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Héctor", p: "Pacheco", r: "PAHE5409265Q4", c: "15DTV0061L", d: "Telesecundarias", e: "dtv0061l.hp@desysa.edu.mx", f: "DOCENTE" },
    { n: "DINA", p: "CUERVO MELGOZA", r: "CUMD700806IE5", c: "15DTV0033P", d: "Telesecundarias", e: "dtv0033p.dcm@desysa.edu.mx", f: "DOCENTE" },
    { n: "JUDITH", p: "GOMEZ ROSALES", r: "GORJ720506JU7", c: "15DTV0155Z", d: "Telesecundarias", e: "dtv0155z.jgr@desysa.edu.mx", f: "DOCENTE" },
    { n: "Mirna", p: "Jonguitud Avila", r: "JOAM730820NQA", c: "15DTV0402S", d: "Telesecundarias", e: "dtv0402s.mja@desysa.edu.mx", f: "DIRECTORA" },
    { n: "LILIANA", p: "MUCIÑO JIMÉNEZ", r: "MUJL790430LF9", c: "15DTV0098Z", d: "Telesecundarias", e: "dtv0098z.lmj@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Maria Cecilia", p: "Garcia Vivas", r: "GAVC621122MU5", c: "15DES0274H", d: "Generales", e: "des0274h.mcgv@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Orlanda Magdalena", p: "Matias Salvador", r: "MASO700101XXX", c: "DES0317P", d: "Generales", e: "des0317p.omms@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Monica", p: "Rangel Alvarez", r: "RAAM740827CH2", c: "15DTV0015Z", d: "Telesecundarias", e: "dtv0015zmra@desysa.edu.mx", f: "DOCENTE" },
    { n: "Salvador", p: "Arguello Ramírez", r: "AURS630214H70", c: "DES0368W", d: "Generales", e: "des0368w.sar@desysa.edu.mx", f: "PREFECTO" },
    { n: "Domitila", p: "Leaños Márquez", r: "LEDM710115610", c: "15DTV0095B", d: "Telesecundarias", e: "dtv0095b.dlm@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Judith Guadalupe", p: "Rivero Serrano", r: "RISJ800927NA0", c: "15DTV0328A", d: "Telesecundarias", e: "dtv0328a.jgrs@desysa.edu.mx", f: "DIRECTORA" },
    { n: "José Adrian", p: "Fuentes León", r: "FULA550319GP2", c: "15DTV0013B", d: "Telesecundarias", e: "dtv0013b.jafl@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Claudia Edith", p: "Barcenas Soriano", r: "BASC8307035H1", c: "15DTV0183W", d: "Telesecundarias", e: "dtv0183w.cebs@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Miguel", p: "Aranda Martinez", r: "AAMM630808QKA", c: "15DES0285N", d: "Generales", e: "des0285n.maa@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Maria Alejandra", p: "Reynoso Bouchán", r: "REBA501126PNA", c: "15DES0361C", d: "Generales", e: "des0361c.marb@desysa.edu.mx", f: "DIRECTIVA" },
    { n: "Maricruz", p: "Huitrón Valdez", r: "HUVM7906124Z8", c: "15DES0029X", d: "Generales", e: "des0029x.mhv@desysa.edu.mx", f: "SUBDIRECTORA" },
    { n: "Raul", p: "Portillo Rodriguez", r: "PORR590722986", c: "15ftv0007p", d: "Telesecundarias", e: "ftv0007p.rpr@desysa.edu.mx", f: "SUPERVISOR" },
    { n: "Gustavo Arturo", p: "Bernal Arenas", r: "BEAG710702N77", c: "15DTV0374M", d: "Telesecundarias", e: "dtv0374m.gaba@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Job", p: "López Ortega", r: "LOOJ470315QI8", c: "15FTV0004S", d: "Telesecundarias", e: "ftv0004s.jlo@desysa.edu.mx", f: "SUPERVISOR" },
    { n: "Juan Lorenzo", p: "Guajardo Cortés", r: "GUCJ580807TQ1", c: "15FIS0039Y", d: "Generales", e: "fis0039y.jlgc@desysa.edu.mx", f: "SUPERVISOR" },
    { n: "Maria del Carmen", p: "Astudillo Alcaraz", r: "AUAC590908HN2", c: "15DTV0030S", d: "Telesecundarias", e: "dtv0030s.mcaa@desysa.edu.mx", f: "DOCENTE" },
    { n: "Julia", p: "Castán Santiago", r: "CASJ620903E64", c: "15DTV0221I", d: "Telesecundarias", e: "dtv0221i.jcs@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Luz María", p: "Camacho Rodríguez", r: "CARL530120SQ3", c: "DTV0384T", d: "Telesecundarias", e: "dtv0384t.lmcr@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Yolanda", p: "Flores Merchant", r: "FOMY510325QV9", c: "15DES0102P", d: "Generales", e: "des0102p.yfm@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Gregory Cristopher", p: "Heredia Ramirez", r: "HERG930425IX6", c: "15DTV0055A", d: "Telesecundarias", e: "dtv0055a.gchr@desysa.edu.mx", f: "DOCENTE" },
    { n: "Olimpia Manelic", p: "Salgado Cervantes", r: "SACO750526S19", c: "FIS0019K", d: "Generales", e: "fis0019k.omsc@desysa.edu.mx", f: "SUPERVISORA" },
    { n: "Nohemi", p: "Fuentes Minor", r: "FUMN900527P18", c: "15DTV0219U", d: "Telesecundarias", e: "dtv0219u.nfm@desysa.edu.mx", f: "DOCENTE" },
    { n: "Wendy", p: "Martinez Nava", r: "MANW7702222HG0", c: "15DES0278D", d: "Generales", e: "des0278d.wmn@desysa.edu.mx", f: "DIRECTORA" },
    { n: "JOAQUIN", p: "GARCIA LOPEZ", r: "GALJ620816J39", c: "DES0070N", d: "Generales", e: "des0070n.jgl@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Bernardino Juan", p: "Huerta Durán", r: "HUDB430520Q58", c: "15DES0298R", d: "Generales", e: "des0298r.bhd@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Dalila", p: "Hernandez Gutierrez", r: "HEGD840119664", c: "15dtv0257x", d: "Telesecundaria", e: "dtv0257x.dhg@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Bernardino", p: "Gonzalez Rodriguez", r: "GORB580520I39", c: "15DTV0293B", d: "Telesecundaria", e: "dtv0293b.bgr@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Rigel", p: "Morán Guzmán", r: "MOGR781012ES9", c: "15DES0238C", d: "Generales", e: "des0238c.rmg@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Ansberto", p: "Reyes Bolaños", r: "REBA550209LN6", c: "15DES0014V", d: "Generales", e: "des0014v.arb@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MARIBEL", p: "PEDRAZA GARCIA", r: "PEGM700617CG9", c: "15DTV0333M", d: "Telesecundaria", e: "dtv0333m.mpg@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Marco Antonio", p: "Lopez Iturbe", r: "LOIM700803QQ5", c: "15DES0100R", d: "Generales", e: "des100r.mali@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Darby", p: "López Sánchez", r: "LOSD560906AP1", c: "15DTV0089R", d: "Telesecundaria", e: "dtv0089r.dls@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Cesar", p: "Hernandez Basilio", r: "HEBC710405N51", c: "15DES0352V", d: "Generales", e: "des0352v.chb@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Sodelba", p: "Torres Parrales", r: "TOPS640518QS4", c: "15DES0295U", d: "Generales", e: "des0295u.stp@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Jaime", p: "Hernández Ramos", r: "HERJ550715GF5", c: "15DES0335E", d: "Generales", e: "des0335e.jhr@desysa.edu.mx", f: "DOCENTE" },
    { n: "Juana", p: "Hernández Reyna", r: "HERJ640702JGA", c: "15DES0031L", d: "Generales", e: "des0031l.jhr@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Lourdes Monsserrat", p: "Teran Orozco", r: "TEOL8308065A8", c: "15DES0097U", d: "Generales", e: "des0097u.lmto@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "Raúl", p: "Valdez Monroy", r: "VAMR700627GQ1", c: "15DES0049K", d: "Generales", e: "des0049k.rvm@desysa.edu.mx", f: "DOCENTE" },
    { n: "MARIA LUCIA", p: "SANCHEZ NAVARRO", r: "SANL6312157C6", c: "15DES0054W", d: "Generales", e: "des0054w.mlsn@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Omar", p: "Contreras Ramírez", r: "CORO930501BR1", c: "15DES0263B", d: "Generales", e: "des0263b.ocr@desysa.edu.mx", f: "DOCENTE" },
    { n: "GABRIEL APOLO", p: "DOMINGUEZ NARVAEZ", r: "DONG700720R91", c: "15DES0286M", d: "Generales", e: "des0286m.gadn@desysa.edu.mx", f: "DIRECTOR" },
    { n: "MA. GUADALUPE", p: "GARCIA MANZO", r: "GAMM710610J68", c: "15DTV0383U", d: "Telesecundaria", e: "dtv0383u.mggm@desysa.edu.mx", f: "DIRECTIVO" },
    { n: "JOSÉ JORGE", p: "PORTILLA ENRÍQUEZ", r: "POEJ670923MP1", c: "DE0364Z", d: "Generales", e: "des0364z.jjpe@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Maria De La Luz", p: "Acosta Aduna", r: "AOAL7512147Z4", c: "15DES0043Q", d: "Generales", e: "des0043q.mdllaa@desysa.edu.mx", f: "DOCENTE" },
    { n: "VICTOR LUIS", p: "SANTILLAN SANCHEZ", r: "SLSV700101XXX", c: "15DTV0140Y", d: "Telesecundarias", e: "dtv0140y.vlss@desysa.edu.mx", f: "DOCENTE" },
    { n: "María Isabel", p: "Godínez Pérez", r: "GOPI860130MD3", c: "15DES0355S", d: "Generales", e: "des0355s.misp@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Aida", p: "Rojas Pelcastre", r: "ROPA650202K91", c: "15DES0035H", d: "Generales", e: "des0035h.arp@desysa.edu.mx", f: "DIRECTORA" },
    { n: "Aleyda", p: "Flores Martinez", r: "FOMA930302485", c: "15DES0268X", d: "Generales", e: "des0268x.afm@desysa.edu.mx", f: "DOCENTE" },
    { n: "Erick Daniel", p: "Tinajero Gutierrez", r: "TIGE550413QJA", c: "15DES0099S", d: "Generales", e: "des0099s.edtg@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Fabiola Guadalupe", p: "Arcos Flores", r: "AOFF940425H56", c: "15DSN0003X", d: "Generales", e: "dsn0003x.fgaf@desysa.edu.mx", f: "DOCENTE" },
    { n: "Teofilo", p: "Catarino Dircio", r: "CADT5710133Y1", c: "DES0103O", d: "Generales", e: "des0103o.tcd@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Cándido", p: "Hernández Ortiz", r: "HEOC601222IZ0", c: "15DES0220D", d: "Generales", e: "des0220d.cho@desysa.edu.mx", f: "DIRECTOR" },
    { n: "Laura Olga", p: "Carcaño Leal", r: "CALL650624D44", c: "15DES0094X", d: "Generales", e: "des0094x.locl@desysa.edu.mx", f: "DOCENTE" },
    { n: "JUANA ARELI", p: "BARRERA HERNANDEZ", r: "BAHJ880319JU3", c: "15DES0349H", d: "Generales", e: "des0349h.jabh@coees.edu.mx", f: "INTENDENTE" },
    { n: "FELIPE", p: "CANO VAZQUEZ", r: "CAVF900707KT7", c: "15DES0349H", d: "Generales", e: "des0349h.fcv@coees.edu.mx", f: "ADMINISTRATIVO" },
    { n: "ABRAHAM", p: "CASTRO GACHUZ", r: "CAGX9103164V8", c: "15DES0349H", d: "Generales", e: "des0349h.acg@coees.edu.mx", f: "DOCENTE" },
    { n: "LAURA", p: "CEDILLO ROMO", r: "CERL911124RP5", c: "15DES0349H", d: "Generales", e: "des0349h.lcr@desysa.edu.mx", f: "DOCENTE" }
  ];

  const grouped: Record<string, any[]> = {};
  rawAccounts.forEach(acc => {
    const cct = acc.c.toUpperCase();
    if (!grouped[cct]) grouped[cct] = [];
    grouped[cct].push({
      paterno: acc.p.split(' ')[0] || '',
      materno: acc.p.split(' ')[1] || '',
      nombres: acc.n,
      rfc: acc.r.toUpperCase(),
      funcion: acc.f || acc.d.toUpperCase(),
      email: acc.e,
      cct: cct,
      municipio: acc.d,
      nombreCT: `PLANTEL ${cct}`
    });
  });

  return Object.entries(grouped).map(([cct, users], i) => ({
    id: `ACC-GRP-${i}`,
    name: 'Cuentas Institucionales',
    cct: cct,
    status: 'activo',
    date: '2026-02-15',
    progress: 100,
    asistentes: users,
    schoolName: `CENTRO DE TRABAJO ${cct}`,
    email: users[0].email 
  }));
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
