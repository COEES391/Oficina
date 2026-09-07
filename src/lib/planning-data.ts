export type AppUser = {
  id?: string;
  rfc: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
  privileges: string[]; 
};

export type BitacoraEntry = {
  id?: string;
  folio: string;
  cct: string;
  schoolName: string;
  servicio: string;
  oficina: string;
  fecha: string;
  tecnico: string;
  tipo: 'FORMAL' | 'LIVE';
  status: 'atendido' | 'proceso' | 'pendiente';
  pdfData?: string;
  pdfName?: string;
  excelData?: string;
  excelName?: string;
  requesterName?: string;
  requesterEmail?: string;
  helpTopic?: string;
  ticketDetail?: string;
};

export type VisitSchedule = {
  id?: string;
  areaId: string; 
  cct: string;
  schoolName: string;
  date: string;
  purpose: string;
  technicians: string;
  status: 'atendido' | 'en proceso' | 'pendiente';
  observaciones: string;
};

export type ProgramStatus = {
  id?: string;
  name: string;
  progress: number;
  status: 'activo' | 'suspendida' | 'inactivo' | 'concluido';
  date: string;
  cct: string;
  schoolName?: string;
  userName?: string; // Responsable
  rfc?: string; 
  puesto?: string;
  departamento?: string;
  email?: string; // Email principal
  emails?: string[]; // Correos adicionales
  zonaEscolar?: string;
  sector?: string;
  modalidad?: string;
  municipio?: string;
  region?: string;
  valle?: string;
  latitud?: string;
  longitud?: string;
  observaciones?: string;
  reportPdf?: string;
  evidencePhotos?: string[];
  asistentes?: any[];
  bibliotecaFases?: {
    fase1: boolean; // Diagnóstico
    fase2: boolean; // Cableado
    fase3: boolean; // Conectividad
    fase4: boolean; // Habilitación
    fase4_1: boolean;
    fase4_2: boolean;
    fase5: boolean; // Configuración
    fase6: boolean; // Pruebas
    fase7: boolean; // Entrega
    fase7_1: boolean;
    personalCapacitado: number;
    equiposHabilitados: number;
  };
};

export const programsData: any[] = [];
export const supportData: SupportTicket[] = [];
export const trainingRecords: any[] = [];

export type SupportTicket = {
  id?: string;
  cct: string;
  schoolName: string;
  tecnicos: string;
  fechaEntrada: string;
  fechaSalida?: string;
  status: 'atendido' | 'en proceso' | 'pendiente';
  tipoIncidencia: string; 
  tipoIncidencias?: string[]; 
  
  semana?: string;
  periodoReportado?: string;
  oficina?: string;
  ze?: string;
  sector?: string;
  modalidad?: string;
  municipio?: string;
  region?: string;
  valle?: string;
  alumnosBeneficiados?: number;
  numEquipos?: number;
  descripcionEquipo?: string;
  serviciosMC?: number;
  serviciosMP?: number;
  redEdusatInst?: boolean;
  redEdusatMant?: boolean;
  redLocalInst?: boolean;
  redLocalMant?: boolean;
  observaciones1?: string;
  
  edusatFicha?: {
    mikropak: { revision: boolean; polarizacion: boolean; prueba: boolean; cambio: boolean };
    antena: { orientacion: boolean; reparacion: boolean; reubicacion: boolean; cambio: boolean };
    decodificador: { configuracion: boolean; reubicacion: boolean; cambio: boolean };
    cableado: { cambioCampanas: boolean; cambioDivisor: boolean; cambioCable: boolean };
    preventivo: { revisionGeneral: boolean; limpiezaGeneral: boolean; cuidadosPreventivos: boolean };
    numCensalDeco: string;
    numSerieDeco: string;
    calidadSenal: string;
    operaciones: { material: string; cantidad: string; actividad: string }[];
  };

  redLocalFicha?: {
    nodos: string;
    cuentaRedLocal: 'si' | 'no' | '';
    requiereMantenimiento: 'si' | 'no' | '';
    electricaAdecuada: 'si' | 'no' | '';
    cuentaInternet: 'si' | 'no' | '';
    proveedorInternet: string;
    anchoBanda: string;
    ampliacionRed: 'si' | 'no' | '';
    nuevaRed: 'si' | 'no' | '';
    materiales: {
      canaleta: { coees: string, ct: string },
      cableUTP: { coees: string, ct: string },
      rosetas: { coees: string, ct: string },
      conectores: { coees: string, ct: string },
      pijas: { coees: string, ct: string },
      cinturones: { coees: string, ct: string },
      switch: { coees: string, ct: string },
      conectoresRJ45: { coees: string, ct: string }
    },
    mantenimientoAula: {
      conectores: boolean,
      parcheo: boolean,
      cableUTP: boolean,
      rosetas: boolean,
      canaletas: boolean,
      configuracion: boolean
    },
    mantenimientoEquipos: {
      formateo: boolean,
      windows: boolean,
      office: boolean,
      drivers: boolean,
      antivirus: boolean,
      software: boolean,
      hardware: boolean
    },
    ubicacionAula: {
      tallerComputo: boolean,
      aulaMedios: boolean,
      hdt: boolean,
      ofimatica: boolean,
      areaAdmin: boolean,
      otros: boolean
    }
  };

  mantenimientoFicha?: {
    equipoTecnologico: { hdt: boolean; equipoComputo: boolean; otro: string };
    equiposList: { equipo: string; marca: string; serie: string; censal: string }[];
    fallaIdentificada: string;
    servicioRealizado: string;
    observaciones: string;
  };

  responsablesList?: string[];
  responsable1?: string;
  responsable2?: string;
  responsable3?: string;
  responsable4?: string;

  fases?: {
    diagnostico: boolean;
    cableado: boolean;
    conectores: boolean;
    pastaTermica: boolean;
    limpieza: boolean;
    configuracion: boolean;
    pruebas: boolean;
  };
};
