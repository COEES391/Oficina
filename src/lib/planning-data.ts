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
};

const getEditorialData = (): ProgramStatus[] => {
  const data: ProgramStatus[] = [];
  for (let i = 1; i <= 827; i++) {
    const isMexico = i % 2 === 0;
    const vert = i > 400 ? (i > 600 ? 'DTV' : 'DST') : 'DES';
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
      fechaModif: '2023/04/19',
      fechaRevision: '2025/09/01',
      date: '2023/04/19',
      status: i % 4 === 0 ? 'planeacion' : 'concluido',
      email: `${cct.toLowerCase()}@desysa.gob.mx`,
      observaciones: 'Auditoría COEES 2026 conforme a lineamientos.',
      name: 'Conoce mi Escuela',
      progress: 100,
      fechaSuspension: i % 20 === 0 ? '2024/05/20' : ''
    });
  }
  return data;
};

export const programsData: ProgramStatus[] = [
  { id: 'BD-1', name: 'Biblioteca Digital', cct: '15DES0001R', schoolName: 'SECUNDARIA FEDERAL 1', valle: 'TOLUCA', modalidad: 'DES', status: 'concluido', date: '2025-05-20', progress: 100, numeroEquipos: 15, capacitacion: 'S' },
  { id: 'CI-1', name: 'Cuentas Institucionales', cct: '15DES0065B', schoolName: 'JUAN PÉREZ SÁNCHEZ', email: 'des0065b@desysa.gob.mx', valle: 'MÉXICO', modalidad: 'DES', status: 'activo', date: '2026-01-10', progress: 100 },
  ...getEditorialData()
];

export const supportData = [
  { id: 'S001', cct: '15EES0001Z', schoolName: 'Secundaria Fed. 1', status: 'atendido', tipoIncidencia: 'mantenimiento preventivo', fechaEntrada: '2024-05-20' }
];