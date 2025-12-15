export type AttendanceRecord = {
  id: string;
  rfc: string;
  userName: string;
  course: string;
  timestamp: Date;
  type: 'entrada' | 'salida';
};

export type Course = {
  id: string;
  name: string;
};

export type User = {
  rfc: string;
  name: string;
  avatarUrl: string;
};

export const users: User[] = [
  { rfc: 'XAXX010101000', name: 'Usuario Genérico', avatarUrl: '/avatars/01.png' },
  { rfc: 'JECM900315H8A', name: 'Miguel Angel Jáuregui', avatarUrl: '/avatars/02.png' },
  { rfc: 'ROGL850412M1A', name: 'Laura Robles Gómez', avatarUrl: '/avatars/03.png' },
  { rfc: 'PECD781123A2B', name: 'David Pérez Cruz', avatarUrl: '/avatars/04.png' },
];

export const courses: Course[] = [
  { id: 'dev-101', name: 'Desarrollo Web Full-Stack' },
  { id: 'ux-202', name: 'Diseño de Experiencia de Usuario' },
  { id: 'dsci-301', name: 'Ciencia de Datos con Python' },
  { id: 'cloud-101', name: 'Fundamentos de Cloud Computing' },
];

const now = new Date();

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    rfc: 'JECM900315H8A',
    userName: 'Miguel Angel Jáuregui',
    course: 'Desarrollo Web Full-Stack',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 58, 12),
    type: 'entrada',
  },
  {
    id: '2',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'Desarrollo Web Full-Stack',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 2, 45),
    type: 'entrada',
  },
  {
    id: '3',
    rfc: 'PECD781123A2B',
    userName: 'David Pérez Cruz',
    course: 'Diseño de Experiencia de Usuario',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 5, 22),
    type: 'entrada',
  },
  {
    id: '4',
    rfc: 'JECM900315H8A',
    userName: 'Miguel Angel Jáuregui',
    course: 'Desarrollo Web Full-Stack',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 3, 50),
    type: 'salida',
  },
    {
    id: '5',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'Desarrollo Web Full-Stack',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 1, 15),
    type: 'entrada',
  },
  {
    id: '6',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'Desarrollo Web Full-Stack',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 5, 30),
    type: 'salida',
  },
];
