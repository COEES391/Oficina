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
    { n: "Guadalupe", p: "Avila Morales", r: "AIMG710117CC6", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.gam@desysa.edu.mx" },
    { n: "Mercedes", p: "Blancas Jimenez", r: "BAJM6409249P9", v: "MEXICO", c: "15DTV0044V", f: "ADMINISTRATIVO", e: "dtv0044v.mbj@desysa.edu.mx" },
    { n: "Cuauhtemoc", p: "Camargo Castillo", r: "CACC811102S85", v: "MEXICO", c: "15DTV0044V", f: "DIRECTOR", e: "dtv0044v.ccc@desysa.edu.mx" },
    { n: "Mayra Yetlanezi", p: "Castro Camarillo", r: "CACM911021CN5", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.mycc@desysa.edu.mx" },
    { n: "Luis Enrique", p: "Cortes Mejía", r: "COML960713L23", v: "MEXICO", c: "15DTV0044V", f: "ASISTENTE DE SERVICIOS", e: "dtv0044v.lecm@desysa.edu.mx" },
    { n: "Goria Elizabeth", p: "Fuentes Camargo", r: "FUCG750329EBA", v: "MEXICO", c: "15DTV0044V", f: "SUBDIRECTORA", e: "dtv0044v.gefc@desysa.edu.mx" },
    { n: "Luis Alberto", p: "García Fernandez", r: "GAFL751210R50", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.lagf@desysa.edu.mx" },
    { n: "Ambar Gabriela", p: "Páez Cantón", r: "PACA710116GJ9", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.agpc@desysa.edu.mx" },
    { n: "Itzel Karyme", p: "Perea Ake", r: "PEAI950404NP0", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.ikpa@desysa.gob.mx" },
    { n: "Michelle Amairani", p: "Pérez Carrasco", r: "PECM9304295B8", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.mapc@desysa.edu.mx" },
    { n: "Jesus Omar", p: "Pérez Gonzalez", r: "PEGJ800715Q40", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.jopg@desysa.edu.mx" },
    { n: "Jose Felipe", p: "Sanchez Pozos", r: "SAPF720622FHA", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.jfsp@desysa.edu.mx" },
    { n: "Edgar", p: "Solis Vera", r: "SOVE730425FN7", v: "MEXICO", c: "15DTV0044V", f: "DOCENTE", e: "dtv0044v.esv@desysa.edu.mx" },
    { n: "NORMA ANGELICA", p: "DIAZ SALAS", r: "DISN6803277W4", v: "MEXICO", c: "15FIS0023X", f: "ADMINISTRATIVO", e: "fis0023x.nads@desysa.edu.mx" },
    { n: "ISIDRO CONSTANTINO", p: "TORRES GONZALEZ", r: "TOGI500515AS6", v: "MEXICO", c: "15FIS0023X", f: "SUPERVISOR", e: "fis0023x.ictg@desysa.edu.mx" },
    { n: "Rolando", p: "Solano Ramírez", r: "SORR521120365", v: "MEXICO", c: "15DTV0118W", f: "DIRECTOR", e: "dtv0118w.rsr@desysa.edu.mx" },
    { n: "Álvaro", p: "López Saldaña", r: "LOSA850322MK8", v: "MEXICO", c: "15DTV0118W", f: "DOCENTE", e: "dtv0118w.als@desysa.edu.mx" },
    { n: "Karla Patricia", p: "Arreola Gutierrez", r: "AEGK8007232L0", v: "MEXICO", c: "15DTV0118W", f: "DOCENTE", e: "dtv0118w.kpag@desysa.edu.mx" },
    { n: "Ruth", p: "Cadenas Pliego", r: "CAPR480112V18", v: "MEXICO", c: "15DES0236E", f: "DIRECTORA", e: "des0236e.rcp@desysa.edu.mx" },
    { n: "Korinna Erika", p: "Cardénas Rojas", r: "CARK800902BI3", v: "MEXICO", c: "15DES0236E", f: "DOCENTE", e: "des0236e.kecr@desysa.edu.mx" },
    { n: "Alma Rosa", p: "Camacho Guzmán", r: "CAGX921116E14", v: "MEXICO", c: "15DES0236E", f: "DOCENTE", e: "des0236e.arcg@desysa.edu.mx" },
    { n: "Cesar", p: "Aguilar Marcos", r: "AUMC7210231G5", v: "MEXICO", c: "15DTV0022J", f: "DOCENTE", e: "dtv0022jcam@desysa.edu.mx" },
    { n: "Raul", p: "Garcia Lopez", r: "GALR910830RU7", v: "MEXICO", c: "15DTV0094C", f: "DIRECTOR", e: "dtv0094c.rgl@desysa.edu.mx" },
    { n: "MARCO ANTONIO", p: "HERNANDEZ GALLARDO", r: "HEGM4805249S8", v: "MEXICO", c: "15DTV0006S", f: "DIRECTOR", e: "dtv0006smahg@desysa.edu.mx" },
    { n: "HELISHEVA DEL CONSUELO", p: "CONTRERAS SÁNCHEZ", r: "COSH830210GX3", v: "MEXICO", c: "15DTV0006S", f: "SUBDIRECTORA", e: "dtv0006shccs@desysa.edu.mx" },
    { n: "Martha Imelda", p: "Ramirez Quiroz", r: "RAQM570512TF0", v: "MEXICO", c: "15FTS0002G", f: "JEFA DE SECTOR", e: "fts0002gmirq@desysa.edu.mx" },
    { n: "Victor Hugo", p: "Miranda Rosas", r: "MIRV640913FE4", v: "MEXICO", c: "15DTV0032Q", f: "DIRECTOR", e: "dtv0032qvhmr@desysa.edu.mx" },
    { n: "Alberto", p: "Hernández Hernández", r: "HEHA7203182P1", v: "MEXICO", c: "15DTV0110D", f: "DIRECTOR", e: "fts0003fahh@desysa.edu.mx" },
    { n: "Adelaido", p: "Azpeitia Hernandez", r: "AEHA701116MA5", v: "MEXICO", c: "15DTV0123H", f: "DIRECTOR", e: "dtv0123h.aah@desysa.edu.mx" },
    { n: "Hector Alejandro", p: "Rodriguez Gonzalez", r: "ROGH8105131G5", v: "MEXICO", c: "15DES0046N", f: "DIRECTIVO", e: "des0046n.hrg@desysa.edu.mx" },
    { n: "Elizander", p: "Dominguez Peña", r: "DOPE700225KW7", v: "TOLUCA", c: "15DTV0271Q", f: "DIRECTOR", e: "dtv0271q.edp@desysa.edu.mx" },
    { n: "Catalina Juana", p: "Guzman Cardeña", r: "GUCC651231L66", v: "MEXICO", c: "15DTV0108P", f: "DIRECTIVA", e: "dtv0108p.cjgc@desysa.edu.mx" },
    { n: "Gerardo", p: "Sánchez Solano", r: "SASG790215FX4", v: "MEXICO", c: "15DTV0019W", f: "DIRECTOR", e: "dtv0019w.gss@desysa.edu.mx" },
    { n: "JAVIER", p: "RODRIGUEZ GUTIERREZ", r: "ROGJ6505193P9", v: "MEXICO", c: "15DTV0111C", f: "DIRECTOR", e: "dtv0111c.jrg@desysa.edu.mx" },
    { n: "Sandra", p: "Zepeda Veloz", r: "ZEVS580114668", v: "MEXICO", c: "15DTV0096A", f: "DIRECTORA", e: "dtv0096a.szv@desysa.edu.mx" },
    { n: "JOEL ENRIQUE", p: "VARGAS CORTES", r: "VACJ7207133B7", v: "MEXICO", c: "15DTV0007R", f: "DIRECTOR", e: "dtv0007r.jevc@desysa.edu.mx" },
    { n: "Rosa Lilia", p: "Vazquez", r: "VAVA700101XXX", v: "MEXICO", c: "15DTV0083X", f: "DIRECTORA", e: "dtv0083xrlv@desysa.edu.mx" },
    { n: "Pedro", p: "Neri Olea", r: "NEOP750629GQ9", v: "MEXICO", c: "15DTV0187S", f: "DIRECTOR", e: "dtv00187s.pno@desysa.edu.mx" },
    { n: "Miguel Enrique", p: "Juarez Campos", r: "JUCM6810028B5", v: "MEXICO", c: "DES0354T", f: "DIRECTOR", e: "des0354t.mejc@desysa.edu.mx" },
    { n: "Rodolfo Anibal", p: "Campos Vargas", r: "CAVR700101XXX", v: "MEXICO", c: "15DTV0135M", f: "DIRECTOR", e: "dtv0135m.racv@desysa.edu.mx" },
    { n: "MARIA ISABEL ELENA", p: "LOPEZ CASTRO", r: "LOCI610330I19", v: "MEXICO", c: "15DTV0003V", f: "DIRECTORA", e: "dtv0003v.mislc@desysa.edu.mx" },
    { n: "ERIKA JANET", p: "MALDONADO HERNÁNDEZ", r: "MAHE780311K77", v: "MEXICO", c: "15DTV0208O", f: "DIRECTORA", e: "Dtv0208o.ejmh@desysa.edu.mx" },
    { n: "Andrés", p: "López Pérez", r: "LOPA470520JY3", v: "MEXICO", c: "15DTV0002W", f: "DIRECTOR", e: "dtv0002w.alp@desysa.edu.mx" },
    { n: "Héctor", p: "Pacheco", r: "PAHE5409265Q4", v: "MEXICO", c: "15DTV0061L", f: "DOCENTE", e: "dtv0061l.hp@desysa.edu.mx" },
    { n: "DINA", p: "CUERVO MELGOZA", r: "CUMD700806IE5", v: "MEXICO", c: "15DTV0033P", f: "DOCENTE", e: "dtv0033p.dcm@desysa.edu.mx" },
    { n: "JUDITH", p: "GOMEZ ROSALES", r: "GORJ720506JU7", v: "MEXICO", c: "15DTV0155Z", f: "DOCENTE", e: "dtv0155z.jgr@desysa.edu.mx" },
    { n: "Mirna", p: "Jonguitud Avila", r: "JOAM730820NQA", v: "MEXICO", c: "15DTV0402S", f: "DIRECTORA", e: "dtv0402s.mja@desysa.edu.mx" },
    { n: "LILIANA", p: "MUCIÑO JIMÉNEZ", r: "MUJL790430LF9", v: "MEXICO", c: "15DTV0098Z", f: "DIRECTORA", e: "dtv0098z.lmj@desysa.edu.mx" },
    { n: "Maria Cecilia", p: "Garcia Vivas", r: "GAVC621122MU5", v: "MEXICO", c: "15DES0274H", f: "DIRECTORA", e: "des0274h.mcgv@desysa.edu.mx" },
    { n: "Orlanda Magdalena", p: "Matias Salvador", r: "MASO700101XXX", v: "TOLUCA", c: "DES0317P", f: "DIRECTORA", e: "des0317p.omms@desysa.edu.mx" },
    { n: "Monica", p: "Rangel Alvarez", r: "RAAM740827CH2", v: "MEXICO", c: "15DTV0015Z", f: "DOCENTE", e: "dtv0015zmra@desysa.edu.mx" },
    { n: "Salvador", p: "Arguello Ramírez", r: "AURS630214H70", v: "MEXICO", c: "DES0368W", f: "PREFECTO", e: "des0368w.sar@desysa.edu.mx" },
    { n: "Domitila", p: "Leaños Márquez", r: "LEDM710115610", v: "TOLUCA", c: "15DTV0095B", f: "DIRECTORA", e: "dtv0095b.dlm@desysa.edu.mx" },
    { n: "Judith Guadalupe", p: "Rivero Serrano", r: "RISJ800927NA0", v: "MEXICO", c: "15DTV0328A", f: "DIRECTORA", e: "dtv0328a.jgrs@desysa.edu.mx" },
    { n: "José Adrian", p: "Fuentes León", r: "FULA550319GP2", v: "MEXICO", c: "15DTV0013B", f: "DIRECTOR", e: "dtv0013b.jafl@desysa.edu.mx" },
    { n: "Claudia Edith", p: "Barcenas Soriano", r: "BASC8307035H1", v: "MEXICO", c: "15DTV0183W", f: "DIRECTORA", e: "dtv0183w.cebs@desysa.edu.mx" },
    { n: "Miguel", p: "Aranda Martinez", r: "AAMM630808QKA", v: "TOLUCA", c: "15DES0285N", f: "DIRECTOR", e: "des0285n.maa@desysa.edu.mx" },
    { n: "Maria Alejandra", p: "Reynoso Bouchán", r: "REBA501126PNA", v: "TOLUCA", c: "15DES0361C", f: "DIRECTIVA", e: "des0361c.marb@desysa.edu.mx" },
    { n: "Maricruz", p: "Huitrón Valdez", r: "HUVM7906124Z8", v: "TOLUCA", c: "15DES0029X", f: "SUBDIRECTORA", e: "des0029x.mhv@desysa.edu.mx" },
    { n: "Raul", p: "Portillo Rodriguez", r: "PORR590722986", v: "MEXICO", c: "15FTV0007P", f: "SUPERVISOR", e: "ftv0007p.rpr@desysa.edu.mx" },
    { n: "Gustavo Arturo", p: "Bernal Arenas", r: "BEAG710702N77", v: "MEXICO", c: "15DTV0374M", f: "DIRECTOR", e: "dtv0374m.gaba@desysa.edu.mx" },
    { n: "Job", p: "López Ortega", r: "LOOJ470315QI8", v: "MEXICO", c: "15FTV0004S", f: "SUPERVISOR", e: "ftv0004s.jlo@desysa.edu.mx" },
    { n: "Juan Lorenzo", p: "Guajardo Cortés", r: "GUCJ580807TQ1", v: "TOLUCA", c: "15FIS0039Y", f: "SUPERVISOR", e: "fis0039y.jlgc@desysa.edu.mx" },
    { n: "Maria del Carmen", p: "Astudillo Alcaraz", r: "AUAC590908HN2", v: "MEXICO", c: "15DTV0030S", f: "DOCENTE", e: "dtv0030s.mcaa@desysa.edu.mx" },
    { n: "Julia", p: "Castán Santiago", r: "CASJ620903E64", v: "MEXICO", c: "15DTV0221I", f: "DIRECTORA", e: "dtv0221i.jcs@desysa.edu.mx" },
    { n: "Luz María", p: "Camacho Rodríguez", r: "CARL530120SQ3", v: "MEXICO", c: "DTV0384T", f: "DIRECTORA ESCOLAR", e: "dtv0384t.lmcr@desysa.edu.mx" },
    { n: "Yolanda", p: "Flores Merchant", r: "FOMY510325QV9", v: "MEXICO", c: "15DES0102P", f: "DIRECTIVO", e: "des0102p.yfm@desysa.edu.mx" },
    { n: "Gregory Cristopher", p: "Heredia Ramirez", r: "HERG930425IX6", v: "MEXICO", c: "15DTV0055A", f: "DOCENTE", e: "dtv0055a.gchr@desysa.edu.mx" },
    { n: "Olimpia Manelic", p: "Salgado Cervantes", r: "SACO750526S19", v: "MEXICO", c: "FIS0019K", f: "SUPERVISORA ESCOLAR", e: "fis0019k.omsc@desysa.edu.mx" },
    { n: "Nohemi", p: "Fuentes Minor", r: "FUMN900527P18", v: "MEXICO", c: "15DTV0219U", f: "DOCENTE", e: "dtv0219u.nfm@desysa.edu.mx" },
    { n: "Wendy", p: "Martinez Nava", r: "MANW7702222HG0", v: "TOLUCA", c: "15DES0278D", f: "DIRECTORA", e: "des0278d.wmn@desysa.edu.mx" },
    { n: "JOAQUIN", p: "GARCIA LOPEZ", r: "GALJ620816J39", v: "TOLUCA", c: "DES0070N", f: "DIRECTIVO", e: "des0070n.jgl@desysa.edu.mx" },
    { n: "Bernardino Juan", p: "Huerta Durán", r: "HUDB430520Q58", v: "MEXICO", c: "15DES0298R", f: "DIRECTOR", e: "des0298r.bhd@desysa.edu.mx" },
    { n: "Dalila", p: "Hernandez Gutierrez", r: "HEGD840119664", v: "MEXICO", c: "15DTV0257X", f: "DIRECTORA", e: "dtv0257x.dhg@desysa.edu.mx" },
    { n: "Bernardino", p: "Gonzalez Rodriguez", r: "GORB580520I39", v: "MEXICO", c: "15DTV0293B", f: "DIRECTOR", e: "dtv0293b.bgr@desysa.edu.mx" },
    { n: "Rigel", p: "Morán Guzmán", r: "MOGR781012ES9", v: "MEXICO", c: "15DES0238C", f: "DIRECTOR", e: "des0238c.rmg@desysa.edu.mx" },
    { n: "Aide", p: "Herrera Vázquez", r: "HEVA850722HJ3", v: "MEXICO", c: "15DTV0385S", f: "DOCENTE", e: "dtv0385s.ahv@desysa.edu.mx" },
    { n: "MARIA LUCIA", p: "SANCHEZ NAVARRO", r: "SANL6312157C6", v: "MEXICO", c: "15DES0054W", f: "DIRECTOR", e: "des0054w.mlsn@desysa.edu.mx" },
    { n: "Omar", p: "Contreras Ramírez", r: "CORO930501BR1", v: "TOLUCA", c: "15DES0263B", f: "DOCENTE", e: "des0263b.ocr@desysa.edu.mx" },
    { n: "Jiovany Jaime", p: "Palacios Suarez", r: "PAJJ700101XXX", v: "MEXICO", c: "15DTV0401T", f: "DIRECTIVO", e: "dtv0401t.jjps@desysa.edu.mx" },
    { n: "GUSTAVO", p: "ZAPATA YAÑEZ", r: "ZAYG771205AWA", v: "MEXICO", c: "15DES0275G", f: "DIRECTIVO", e: "des0275g.gzy@desysa.edu.mx" },
    { n: "Ruben", p: "Martinez Yañez", r: "MAYR6802243C5", v: "TOLUCA", c: "15DES0003P", f: "DIRECTOR", e: "des0003p.rmy@desysa.edu.mx" },
    { n: "ULISES", p: "GREGORIO HERNANDEZ", r: "GEHU6811027R0", v: "MEXICO", c: "15DTV0011D", f: "DIRECTOR", e: "dtv0011d.ugh@desysa.edu.mx" },
    { n: "Hector Manuel", p: "Zuñiga Montoya", r: "ZUMH8701305B3", v: "MEXICO", c: "15FIS0041M", f: "ADMINISTRATIVO", e: "fis0041m.hmzm@desysa.edu.mx" },
    { n: "CLAUDIA LUCILA", p: "ALONSO ROJAS", r: "AORC731125HF9", v: "MEXICO", c: "15DTV0060M", f: "DIRECTORA", e: "dtv0060m.clar@desysa.edu.mx" },
    { n: "RUFINO JAVIER", p: "CAMARILLO DURAN", r: "CADR620603U62", v: "MEXICO", c: "DES0358P", f: "DIRECTOR", e: "des0358p.rjcd@desysa.edu.mx" },
    { n: "JAVIER", p: "NICOLAS CRUZ", r: "NICJ630209A83", v: "MEXICO", c: "15DES0047M", f: "DIRECTOR", e: "des0047m.jnc@desysa.edu.mx" },
    { n: "Luis", p: "Sánchez Andonaegui", r: "SAAL630428LBA", v: "MEXICO", c: "15DES0053X", f: "DIRECTOR", e: "des0053x.lsa@desysa.edu.mx" },
    { n: "Guillermo", p: "Medina Meza", r: "MEMG581226PH3", v: "TOLUCA", c: "15DES0111X", f: "DIRECTOR", e: "des0111x.gmm@desysa.edu.mx" },
    { n: "Roberto", p: "Montoya Citalán", r: "MOCR511122B82", v: "MEXICO", c: "15DES0034I", f: "DIRECTOR", e: "des0034i.rmc@desysa.edu.mx" },
    { n: "Ricardo Rafael", p: "Ceniceros Gonzalez", r: "CEGR570618U68", v: "MEXICO", c: "DES0030M", f: "DIRECTOR", e: "des0030m.rircg@desysa.edu.mx" },
    { n: "Martha Raquel", p: "Cerros Contreras", r: "CECM601101N17", v: "MEXICO", c: "15DES0239B", f: "DIRECTORA", e: "des0239b.mrcc@desysa.edu.mx" },
    { n: "Edgar Vladimir", p: "Amaro Nolasco", r: "AANE700723566", v: "MEXICO", c: "DES0066A", f: "DIRECTOR", e: "des0066a.evan@desysa.edu.mx" },
    { n: "Cruz Juanita", p: "Sanchez Morales", r: "SAMC700101XXX", v: "MEXICO", c: "DES0344M", f: "DIRECTORA", e: "des0344m.cjsm@desysa.edu.mx" },
    { n: "DAVID", p: "VARGAS PAREDES", r: "VAPD730827P90", v: "MEXICO", c: "15DTV0241W", f: "DIRECTOR", e: "dtv0241w.dvp@desysa.edu.mx" },
    { n: "Ruben", p: "Martinez Yañez", r: "MAYR6802243C5", v: "MEXICO", c: "15DES0036G", f: "DIRECTOR", e: "des0036g.rmy@desysa.edu.mx" },
    { n: "Andrea", p: "Mendez Suarez", r: "MESA870727A51", v: "MEXICO", c: "DES0057T", f: "DIRECTIVO", e: "des0057t.ams@desysa.edu.mx" },
    { n: "Oscar Zenen", p: "Salgado Cid", r: "SACO850207232", v: "TOLUCA", c: "15DST0002I", f: "DIRECTIVO", e: "dst0002i.ozsc@desysa.edu.mx" },
    { n: "Juan Carlos", p: "Rodríguez Rojas", r: "RORJ821108S83", v: "MEXICO", c: "15DES0045O", f: "DIRECTOR", e: "des0045o.jcrr@desysa.edu.mx" },
    { n: "MA. DEL PILAR", p: "MEDINA MACIEL", r: "MEMM6601135S8", v: "MEXICO", c: "15FIS0045I", f: "SUPERVISORA", e: "gm04045.mpmm@desysa.gob.mx" },
    { n: "JOSÉ ISABEL", p: "CRUZ MARTÍNEZ", r: "CRMJ700101XXX", v: "MEXICO", c: "15DES0360D", f: "DIRECTOR", e: "des0360d.jicm@desysa.edu.mx" },
    { n: "ALEJANDRO PAZ", p: "VARGAS SÁNCHEZ", r: "VASA700101XXX", v: "TOLUCA", c: "15DES0007L", f: "DIRECTOR", e: "des0007l.apvs@desysa.edu.mx" },
    { n: "Aida", p: "Rojas Pelcastre", r: "ROPA650202K91", v: "MEXICO", c: "15DES0035H", f: "DIRECTORA", e: "des0035h.arp@desysa.edu.mx" },
    { n: "Sergio", p: "Valladares Portales", r: "VAPS711008BE4", v: "MEXICO", c: "15DES0268X", f: "DIRECTIVO", e: "des0268x.svp@desysa.edu.mx" },
    { n: "Susana", p: "Reyes Quintero", r: "REQS6810016L1", v: "MEXICO", c: "15DSN0003X", f: "DIRECTORA ESCOLAR", e: "dsn0003x.srq@desysa.edu.mx" },
    { n: "Teofilo", p: "Catarino Dircio", r: "CADT5710133Y1", v: "MEXICO", c: "DES0103O", f: "DIRECTOR", e: "des0103o.tcd@desysa.edu.mx" },
    { n: "Cándido", p: "Hernández Ortiz", r: "HEOC601222IZ0", v: "MEXICO", c: "15DES0220D", f: "DIRECTOR", e: "des0220d.cho@desysa.edu.mx" },
    { n: "Laura Olga", p: "Carcaño Leal", r: "CALL650624D44", v: "MEXICO", c: "15DES0094X", f: "DOCENTE", e: "des0094x.locl@desysa.edu.mx" },
    { n: "Lizbeth", p: "Ortiz Avilés", r: "OIAL770623AU3", v: "MEXICO", c: "15DES0292X", f: "SUBDIRECTORA", e: "des0292x.loa@desysa.edu.mx" },
    { n: "JAVIER", p: "DE LA CRUZ ZAVALA", r: "CRZJ700101XXX", v: "MEXICO", c: "DES0293W", f: "DIRECTOR", e: "des0293w.jcz@desysa.edu.mx" },
    { n: "Olivo", p: "Elías Segura", r: "EISO6608192Y9", v: "MEXICO", c: "DES0058S", f: "DIRECTOR", e: "des0058s.oes@desysa.edu.mx" },
    { n: "ORQUIDEA", p: "SANCHEZ SOLANO", r: "SACO700101XXX", v: "MEXICO", c: "15DTV0209N", f: "DIRECTOR", e: "dtv0209n.oss@desysa.edu.mx" },
    { n: "Laura Cristina", p: "Leyva Zetina", r: "LEZL751019TG0", v: "MEXICO", c: "15DES0254U", f: "DIRECTORA", e: "des0254u.lclz@desysa.edu.mx" },
    { n: "Erika", p: "Cortez Ornelas", r: "COOE731228SH4", v: "MEXICO", c: "15DST0060Z", f: "DIRECTORA", e: "dst0060z.eco@desysa.edu.mx" },
    { n: "Ma. Isbel", p: "Tovar García", r: "TOGI670113UC2", v: "MEXICO", c: "15DST0144G", f: "SUBDIRECTORA", e: "dst0144g.mitg@desysa.edu.mx" },
    { n: "VÍCTOR RODOLFO", p: "ROSAS IBÁÑEZ", r: "ROIV720222R6A", v: "MEXICO", c: "15FZT0021E", f: "SUPERVISOR", e: "fzt0021e.vrri@desysa.gob.mx" },
    { n: "Sodelba", p: "Torres Parrales", r: "TOPS640518QS4", v: "TOLUCA", c: "15DES0295U", f: "DIRECTORA", e: "des0295u.stp@desysa.edu.mx" },
    { n: "Jaime", p: "Hernández Ramos", r: "HERJ550715GF5", v: "MEXICO", c: "15DES0335E", f: "DOCENTE", e: "des0335e.jhr@desysa.edu.mx" },
    { n: "Juana", p: "Hernández Reyna", r: "HERJ640702JGA", v: "MEXICO", c: "15DES0031L", f: "DIRECTORA", e: "des0031l.jhr@desysa.edu.mx" },
    { n: "JOSE", p: "GUTIERREZ HERNANDEZ", r: "GUHJ6607111W9", v: "MEXICO", c: "15DES0349H", f: "DIRECTOR", e: "des0349h.jgh@desysa.edu.mx" }
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
      funcion: acc.f.toUpperCase(),
      email: acc.e,
      cct: cct,
      valle: acc.v,
      municipio: acc.v === 'MEXICO' ? 'ZONA ORIENTE' : 'ZONA CENTRO',
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
    valle: users[0].valle,
    email: users[0].email // Usamos el correo del primer integrante como contacto principal
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
