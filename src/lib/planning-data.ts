
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
  // Editorial Fields
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
    { id: 'ED-2', cct: '15DES0003P', agrupado: 'DESMEXICO02006', vertiente: 'DES', sector: '02', zonaEscolar: '006', fechaAlta: '2009/11/26', fechaModif: '2022/10/12', fechaRevision: '2024/08/07', date: '2023/02/02', status: 'concluido', email: 'des0003p@desysa.gob.mx', observaciones: '9-12-09 Está bien; solo faltó informar de qué ciclo escolar son los alumnos destacados. 11-06-12: Se sugiere actualizar logros y alumnos destacados. 03-05-13: Está bien, sólo hay que actualizar los alumnos y logros. 16-05-13: Se les invita a través del correo institucional a que actualicen el programa, sobre todo, lo referente a logros y alumnos destacados. Se envían los archivos de apoyo, las observaciones y vista previa para que hagan lo propio. Se regenera también la contraseña de acceso. 17-02-14: Sigue el programa sin cambios. Se regenera nuevamente la contraseña de acceso para que entren con SEIEM. 02-03-14: Actualizaron el programa y cumplen con todo. Se les invita a que lo sigan actualizando, sobre todo, en lo referente a alumnos destacados y logros. Se informa al correo institucional y se envían las nuevas observaciones y vista previa. 01-04-14 Actualización IFAI CCM cambiar foto. 29-09-14: Se enviaron nuevamente los archivos de apoyo para que actualicen el programa, se regeneró la contraseña y se informó al correo institucional. 08-10-14: Se hizo revisión general del programa CCM. 10-11-14: Se hizo una revisión general del programa y se mejoró la redacción. Se envía correo informativo para que actualicen con base en los documentos de apoyo. AAA. Paquete I nov. 2014. 20-08-15 Se corrigió ortografía. 24-08-15 Se publico por asignación de plazas. 11-01-16 Se publicó del paquete oficial RCO.25/06/18: Se revisa el programa, se hacen unos ajustes a la redacción y se informa por correo para que actualicen los logros. Supera el estado de suspensión en que estaba. AAA. 25-06-18 Se publicó RCO. 21/01/19: Se publicó el programa de ésta escuela, el cual se había revisado y aprobado el 25 de junio de 2018, y seguía suspendida. AAA. 13/06/2020: Actualizan el programa y está en revisión. AAA. 17/06/2022:Se reviso la actualizacion de este ciclo escolar, se corrige el apartado de logros y se solicita omitir el nombre de alumnos. 20/10/2022: Esta lista para su publicación. GOOP.', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-3', cct: '15DES0004O', agrupado: 'DESMEXICO09023', vertiente: 'DES', sector: '09', zonaEscolar: '023', fechaAlta: '2010/01/22', fechaModif: '2022/10/19', fechaRevision: '2023/04/19', date: '2022/11/03', status: 'concluido', email: 'des0004o@desysa.gob.mx', observaciones: '17-05-10: Historia muy pobre, logros y alumnos destacados mal (deben ser 2 por grado, los mejores promedios al término de cada bimestre evaluado. 15-08-12: Programa sin cambios desde la última observación. AAA. 27-11-12: Una vez mas pedimos actualicen el programa con base en el documento escuela muestra y los pasos subir la información que se envían al correo institucional, con copia a un alterno. AAA. Se revisó y publicó la actualización de información. El apartado de logros la escuela lo modificó y lo dejo de 2018 a 2021. 28/05/2021 JLRA. 13-06-13: El programa sigue igual. Se les invita nuevamente a que lo actualicen y se envían los documentos de apoyo, vista previa y observaciones al correo institucional. Se regenera también la contraseña. AAA. 01-04-14: Actualización IFAI CCM cambiar foto. 03-10-14: Se enviaron por correo los documentos de apoyo actualizados y se reseteó otra vez la contraseña. AAA. 08-10-14: Se hizo revisión general del programa CCM. 23-02-15: Se resetea contraseña por solicitud de la subjefatura correspondiente. AAA. PAQUETE 5. 11-01-16 Se publicó del paquete oficiol RCO. 14/02/2019: Se pide nuevamente que actualicen el programa, se envían las últimas observaciones y lo que tienen actualmente. AAA. Se revisó y publicó la actualización de información. El apartado de logros la escuela lo modificó y lo dejo de 2018 a 2021. Es importante mencionar que para dicha actualización se proporcionó el manual del programa y se ofreció el apoyo necesario para esta actividad. 28/05/2021 JLRA.', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-4', cct: '15DES0005N', agrupado: 'DESMEXICO02008', vertiente: 'DES', sector: '02', zonaEscolar: '008', fechaAlta: '2006/03/28', fechaModif: '2022/11/08', fechaRevision: '2022/11/08', date: '2022/11/08', status: 'concluido', email: 'des0005n@desysa.gob.mx', observaciones: '18-01-06: Actualizar alumnos destacados. 11-06-12: Actualizar logros y alumnos destacados; mencionar en cada uno el ciclo escolar y ajustarse a la escuela muestra. AAA. 30-09-13: Sigue el programa sin cambios, se les invita nuevamente por medio del correo institucional a que hagan lo propio; se envían los archivos de apoyo, las observaciones y vista previa de lo que tiene actualmente. Se resetea también la cuenta para que entren con SEIEM. AAA. 08-11-2022; Se publica su actualización. GOOP 17-10-22: Continua sin actiualizar, se llama via telefonica al Director para que realice la actividad. GOOP 01-04-14 Actualización IFAI CCM, cambiar foto. 29-09-14: Se enviaron nuevamente los documentos de apoyo para que actualicen el programa, se reseteó otra vez la cuenta y se informó al correo institucional. AAA. 08-10-14: Se hizo revisión general del programa CCM. 10/11/2014: Carece de información en logros. NSP. 27-05-15 Se cambio foto. PAQUETE 15. SEGUNDO GRAN PAQUETE. 14-07-16: Se revisa la información y se cambiaron algunos datos para mejorar la redacción, así como, el nombre de los talleres. AAA. 14/02/2019: Se pide nuevamente que actualicen el programa, se envían las últimas observaciones, lo que tienen actualmente y se resetea la cuenta para que entren de manera temporal con la CCT y SEIEM. AAA. 26-10-22 Se revisó y se envia las observaciones por correo electrónico. GOOP', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-5', cct: '15DES0006M', agrupado: 'DESTOLUCA07028', vertiente: 'DES', sector: '07', zonaEscolar: '028', fechaAlta: '2008/10/29', fechaModif: '2023/01/13', fechaRevision: '2022/09/26', date: '2023/01/23', status: 'concluido', email: 'des0006m@desysa.gob.mx', observaciones: '11-09-09 Confunden logros con alumnos destacados y no mencionan el ciclo escolar, nivel y lugar en que se dio cada logro. Los alumnos destacados solo son 6, dos de cada grado al término de cada ciclo escolar o bimestre. Actualizar. AAA. 13-06-12: Programa sin cambios desde la última observación. AAA. 12-11-13: Sigue el programa sin cambios, se les invita nuevamente por medio del correo institucional a que hagan lo propio; se envían los documentos de apoyo, observaciones y vista previa de lo que tiene actualmente. Se regenera también la contraseña de acceso para que entren con SEIEM. AAA. 01-04-14 Actualización IFAI CCM cambiar foto. 10-10-14: Se hizo una revisión general del programa y se suspende por no atender a las indicaciones del mismo en repetidas ocasiones. AAA. 12-11-14: Se hizo otra revisión general del programa, se ordenó la información y se mejoró la redacción para poder publicarse, debido a que han omitido las observaciones. Sigue faltando la foto; se informa al correo institucional y se resetea la contraseña para que actualicen a la brevedad posible. AAA. 17-03-15: Se editó y cambió la imagen.JMM. PAQUETE 11 SEGUNDO GRAN PAQUETE', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-6', cct: '15DES0008K', agrupado: 'DESMEXICO02009', vertiente: 'DES', sector: '02', zonaEscolar: '009', fechaAlta: '2009/11/30', fechaModif: '2022/10/26', fechaRevision: '2022/10/26', date: '2022/10/26', status: 'concluido', email: 'des0008k@desysa.gob.mx', observaciones: '18-06-10: Historia muy corta para el tiempo que tiene la escuela, falta ciclo escolar en logros. 11-06-12: Sigue igual todo, historia muy pobre, no han actualizados logros. 18-06-13: Sin respuesta todavía, se les invita nuevamente por medio del correo institucional a que actualicen el programa y se envían los archivos de apoyo, observaciones y vista previa. AAA. 01-04-14 Actualización IFAI CCM cambiar foto. 30-09-14: Se enviaron nuevamente los archivos de apoyo para que actualicen el programa, se regeneró otra vez la contraseña y se informó al correo institucional. AAA. 07-10-14: Llamaron de COEES Naucalpan (Laura) para que se les enviaran los documentos de apoyo y regenerara la contraseña a esta escuela. El 30 de septiembre ya se les había dado este servicio, sin embargo, nuevamente se atiende la petición. Se informa por correo. AAA. 08-10-14: Se hizo revisión general del programa CCM. 09-10-14 Pidieron que se regenerara la contraseña, se realizo el servicio y se respondió por correo. AAA. 14-10-14: Se hizo revisión general del programa CCM. Paquete lll 10-03-15: Se resetea nuevamente la contraseña para que actualicen y se informa por correo. AAA. 11-01-16 Se publicó del paquete oficial RCO 17-10-22: Continua sin actiualizar, se llama via telefonica al Director para que realice la actividad. GOOP', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-7', cct: '15DES0009J', agrupado: 'DESTOLUCA07027', vertiente: 'DES', sector: '07', zonaEscolar: '027', fechaAlta: '2009/11/27', fechaModif: '2023/08/09', fechaRevision: '2022/09/26', date: '2021/06/03', status: 'concluido', email: 'des0009j@desysa.gob.mx', observaciones: '13-06-12: Programa sin cambios desde la última observación. AAA. 16-01-13: Sigue todo igual; se les invita por medio del correo institucional y otro alterno a que actualicen su proyecto. Se envían los documentos de apoyo, observaciones y vista previa. lo que tiene actualmente. Se regenera la contraseña de acceso y mejora la redacción. 01-04-14 Actualización IFAI CCM cambiar foto. 09-10-14: Se hizo una revisión general del programa. AAA. 06-11-14: Se corrigieron 3 errores de redacción. AAA. PAQUETE 10 11-09-15: Acudió a nuestras oficinas la profesora Xóchitl Gallardo Leyva, directora de la escuela, para recibir asesoría de cómo actualizar el programa y se le otorgó el servicio. Se comprometió a que en una semana ya estaría actualizado. Se informa por correo y se envían las nuevas observaciones, vista previa actual y manual de apoyo. Se resetea también la contraseña. 23-09-15: Actualizaron todo el programa, se revisó y publicó. Se cambió información de la presentación a la historia y viceversa para mejorarlo. Mencionan logros hasta el ciclo 2012-2013; se informa por correo. AAA. 24-09-15 Se publico RCO. SEGUNDO GRAN PAQUETE. 11/10/2018: Actualizan el programa, se revisa y publica. Cumplen con todo. AAA. 11-10-18 Se publicó RCO. 07-08-19 Se revisó cumple con todo AAA. 03-06-21 Se publicó RCO', name: 'Conoce mi Escuela', progress: 100 },
    { id: 'ED-8', cct: '15DES0010Z', agrupado: 'DESMEXICO05033', vertiente: 'DES', sector: '05', zonaEscolar: '033', fechaAlta: '2007/06/18', fechaModif: '2022/10/27', fechaRevision: '2023/01/19', date: '2023/01/19', status: 'concluido', email: 'des0010z@desysa.gob.mx', observaciones: '06-08-09: Actualizar los alumnos destacados. 11-06-12: Sin cambios todavía. Actualizar logros, infraestructura y alumnos destacados, con base en el documento escuela muestra que se envía. 20-08-13: Sin respuesta todavía, se les invita nuevamente por medio del correo institucional a que actualicen el programa; se envían los archivos de apoyo, observaciones y vista previa. Se reasigna también la contraseña de acceso para que entren con SEIEM. 01-04-14 Actualización IFAI CCM cambiar foto. 03-10-14: Se enviaron por correo los documentos de apoyo actualizados y se regeneró otra vez la contraseña. 08-10-14: Se hizo revisión general del programa y cumplen con todo. AAA. Paquete IV. 11-01-16 Se publicó del paquete oficial RCO. 20/03/2019: Se les envía correo para que actualicen el programa, debido a que sigue igual desde hace varios ciclos escolares. Se resetea la cuenta y se se adjunta el Manual de apoyo y lo que tienen actualmente. AAA.', name: 'Conoce mi Escuela', progress: 100 }
  ];

  // Generar el resto hasta 827
  for (let i = 9; i <= 827; i++) {
    const isMexico = i % 2 === 0;
    const vert = i > 400 ? 'DST' : i > 600 ? 'DTV' : 'DES';
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
      status: i % 2 === 0 ? 'concluido' : 'planeacion',
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      observaciones: 'Auditado por COEES para ciclo vigente conforme a lineamientos de Incorporación...',
      name: 'Conoce mi Escuela',
      progress: 100
    });
  }
  return data;
};

export const programsData: ProgramStatus[] = [
  // Cuentas Institucionales (Muestra representativa de los 1,709)
  { id: 'PROG-CI-1', name: 'Cuentas Institucionales', cct: '15DES0065B', schoolName: 'SECUNDARIA GRAL AMECAMECA', valle: 'MÉXICO', modalidad: 'DES GOB', sector: '01', status: 'concluido', date: '2026-01-10', progress: 100, asistentes: [{ nombres: 'Juan', paterno: 'Pérez', materno: 'Sánchez', email: 'des0065b@desysa.gob.mx', rfc: 'ABCD123456', genero: 'MASCULINO', funcion: 'DIRECTOR', cct: '15DES0065B', nombreCT: 'AMECAMECA', ze: '01', sector: '01', modalidad: 'DES', municipio: 'AMECAMECA', region: 'I', valle: 'MÉXICO', departamento: 'DIRECCIÓN' }] },
  { id: 'PROG-CI-2', name: 'Cuentas Institucionales', cct: '15DST0001J', schoolName: 'SECUNDARIA TECNICA 1', valle: 'TOLUCA', modalidad: 'DST GOB', sector: '02', status: 'planeacion', date: '2026-01-11', progress: 50, asistentes: [{ nombres: 'María', paterno: 'López', materno: 'Díaz', email: 'dst0001j@desysa.edu.mx', rfc: 'LMDA123456', genero: 'FEMENINO', funcion: 'DOCENTE', cct: '15DST0001J', nombreCT: 'TOLUCA 1', ze: '02', sector: '02', modalidad: 'DST', municipio: 'TOLUCA', region: 'I', valle: 'TOLUCA', departamento: 'AULA' }] },
  
  // Biblioteca Digital (Captura Técnica)
  { id: 'PROG-BD-1', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', sector: '01', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S', cursoNombre: 'Uso de Biblioteca Digital v2', cursoGrupo: 'GRUPO A', duracionHoras: 20, fechaInicio: '2025-05-01', fechaTermino: '2025-05-15', cctSede: '15DES0001R' },
  
  // Geoposición
  { id: 'PROG-GEO-1', name: 'Geoposición', cct: '15EES0001Z', schoolName: 'SEIEM OFICINAS', valle: 'TOLUCA', modalidad: 'ADM', status: 'concluido', date: '2026-01-10', progress: 100, observaciones: 'Ubicación verificada por satélite. Lat: 19.2900, Lon: -99.6500' },
  
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
