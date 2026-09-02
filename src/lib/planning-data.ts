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
  
  // Campos Hoja de Servicio F4/F5
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
  
  // Ficha Edusat Especializada
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

  // Ficha Red Local Especializada
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

  // Responsables dinámicos
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

export const programsData: ProgramStatus[] = [];
export const supportData: SupportTicket[] = [];
export const trainingRecords: TrainingRecord[] = [];