export type Group = {
  grade: string; // e.g., '1', '2', '3'
  group: string; // e.g., 'A', 'B', 'C'
};

export type Teacher = {
  rfc: string;
  name: string;
  groups: Group[];
};

// SIMULATED DATABASE
// In a real application, this data would come from a database.
// You can edit this list to add or change teachers and their assigned groups.
export const teachers: Teacher[] = [
  {
    rfc: 'RFCPROFESOR1',
    name: 'Prof. Juan Pérez',
    groups: [
      { grade: '1', group: 'A' },
      { grade: '1', group: 'B' },
    ],
  },
  {
    rfc: 'RFCPROFESOR2',
    name: 'Profa. María García',
    groups: [
      { grade: '2', group: 'A' },
      { grade: '2', group: 'B' },
    ],
  },
  {
    rfc: 'RFCPROFESOR3',
    name: 'Prof. José Luis Ramírez',
    groups: [
      { grade: '3', group: 'A' },
      { grade: '3', group: 'B' },
      { grade: '3', group: 'C' },
    ],
  },
   {
    rfc: 'ADMIN',
    name: 'Administrador',
    groups: [],
  },
];
