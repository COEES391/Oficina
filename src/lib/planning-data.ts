export type SupportTicket = {
  id: string;
  cct: string;
  sector: string;
  zona: string;
  school: string;
  issue: 'Red Local' | 'Instalación de Red Local' | 'Red Edusat' | 'Mantenimiento Preventivo' | 'Mantenimiento Correctivo';
  status: 'pendiente' | 'en proceso' | 'resuelto';
  date: string;
  technician?: string;
};

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

export const supportData: SupportTicket[] = [
  { 
    id: 'S001', 
    cct: '15EES0001Z', 
    sector: '01', 
    zona: '12', 
    school: 'Secundaria Fed. 1', 
    issue: 'Red Local', 
    status: 'pendiente', 
    date: '2024-05-20',
    technician: 'Pendiente de asignar'
  },
  { 
    id: 'S002', 
    cct: '15DST0015A', 
    sector: '03', 
    zona: '05', 
    school: 'Secundaria Tec. 15', 
    issue: 'Mantenimiento Correctivo', 
    status: 'resuelto', 
    date: '2024-05-18',
    technician: 'Ing. Carlos Ruiz'
  },
];

export const trainingData: TrainingSession[] = [
  { id: 'C001', title: 'Uso de Herramientas Digitales', instructors: 'Gustavo Bello', attendees: 45, date: '2024-05-15' },
  { id: 'C002', title: 'Gestión de Microsoft 365', instructors: 'Juan Pérez', attendees: 30, date: '2024-05-19' },
];

export const programsData: ProgramStatus[] = [
  { id: 'P001', name: 'Conectividad Escolar 2024', progress: 75, status: 'activo' },
  { id: 'P002', name: 'Renovación de Equipamiento', progress: 40, status: 'planeacion' },
  { id: 'P003', name: 'Cero Rezago Digital', progress: 100, status: 'concluido' },
];
