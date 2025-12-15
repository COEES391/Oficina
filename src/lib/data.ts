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
  { id: 'chatgpt-101', name: 'ChatGPT: En el Aprendizaje' },
  { id: 'chatpdf-102', name: 'ChatPDF: El asistente Virtual para tu Material Educativo' },
  { id: 'kahoot-103', name: 'Kahoot! Diviertete evaluando' },
  { id: 'canva-104', name: 'Canva: Presentaciones visuales y creativas' },
  { id: 'excel-105', name: 'Excel en línea para la gestión educativa' },
  { id: 'rectec-106', name: 'Recursos Tecnologicos para transformar la evaluación y creatividad en el aula' },
  { id: 'm365-107', name: 'Potencia tu procuntividad digital con Microsoft Office 365' },
  { id: 'm365-108', name: 'Microsoft 365: operaciones básicas' },
  { id: 'tictac-109', name: 'Tic y Tac: usando las herramientas clave' },
];

const now = new Date();

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    rfc: 'JECM900315H8A',
    userName: 'Miguel Angel Jáuregui',
    course: 'ChatGPT: En el Aprendizaje',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 58, 12),
    type: 'entrada',
  },
  {
    id: '2',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'ChatGPT: En el Aprendizaje',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 2, 45),
    type: 'entrada',
  },
  {
    id: '3',
    rfc: 'PECD781123A2B',
    userName: 'David Pérez Cruz',
    course: 'Canva: Presentaciones visuales y creativas',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 5, 22),
    type: 'entrada',
  },
  {
    id: '4',
    rfc: 'JECM900315H8A',
    userName: 'Miguel Angel Jáuregui',
    course: 'ChatGPT: En el Aprendizaje',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 3, 50),
    type: 'salida',
  },
    {
    id: '5',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'ChatGPT: En el Aprendizaje',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 1, 15),
    type: 'entrada',
  },
  {
    id: '6',
    rfc: 'ROGL850412M1A',
    userName: 'Laura Robles Gómez',
    course: 'ChatGPT: En el Aprendizaje',
    timestamp: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 17, 5, 30),
    type: 'salida',
  },
];
