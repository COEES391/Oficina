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
  responsables: string[]; // Hasta 6 responsables
  numeroOficio: string;
  alumnosBeneficiados: number;
  numeroEquipos: number;
  materialUtilizado: string;
  betes: 'S' | 'N';
  observaciones: string;
  descripcionEquipo: string;
  fechaEntrada: string;
  fechaSalida: string;
  serviciosMC: number;
  serviciosMP: number;
  status: 'pendiente' | 'en proceso' | 'resuelto';
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
    responsables: ['Ing. Carlos Ruiz', 'Lic. Ana Soto'],
    numeroOficio: 'OF-2024-001',
    alumnosBeneficiados: 450,
    numeroEquipos: 15,
    materialUtilizado: 'Cable UTP Cat6, Conectores RJ45',
    betes: 'S',
    observaciones: 'Pendiente configuración de switch',
    descripcionEquipo: 'Servidor Dell PowerEdge y 14 terminales',
    fechaEntrada: '2024-05-20',
    fechaSalida: '',
    serviciosMC: 1,
    serviciosMP: 0,
    status: 'pendiente', 
  },
];

export type TrainingSession = {
  id: string;
  title: string;
  instructors: string;
  attendees: number;
  date: string;
};

export type ProgramStatus = {
  id: string;
  name: string;
  progress: number;
  status: 'activo' | 'planeacion' | 'concluido';
};

export const trainingData: TrainingSession[] = [
  { id: 'C001', title: 'Uso de Herramientas Digitales', instructors: 'Gustavo Bello', attendees: 45, date: '2024-05-15' },
  { id: 'C002', title: 'Gestión de Microsoft 365', instructors: 'Juan Pérez', attendees: 30, date: '2024-05-19' },
];

export const programsData: ProgramStatus[] = [
  { id: 'P001', name: 'Conectividad Escolar 2024', progress: 75, status: 'activo' },
  { id: 'P002', name: 'Renovación de Equipamiento', progress: 40, status: 'planeacion' },
  { id: 'P003', name: 'Cero Rezago Digital', progress: 100, status: 'concluido' },
];
