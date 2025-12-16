export type Student = {
  id: string;
  name: string;
};

export type Group = {
  grade: string; // e.g., '1', '2', '3'
  group: string; // e.g., 'A', 'B', 'C'
  students: Student[];
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
      { 
        grade: '1', 
        group: 'A',
        students: [
          { id: '1A01', name: 'Alvarez Torres, Sofía' },
          { id: '1A02', name: 'Gómez Hernández, Mateo' },
          { id: '1A03', name: 'Díaz Rodríguez, Valentina' },
          { id: '1A04', name: 'Martínez López, Santiago' },
          { id: '1A05', name: 'Cruz García, Isabella' },
        ]
      },
      { 
        grade: '1', 
        group: 'B',
        students: [
          { id: '1B01', name: 'Pérez Sánchez, Leonardo' },
          { id: '1B02', name: 'Ramírez Morales, Camila' },
          { id: '1B03', name: 'Flores Romero, Emiliano' },
        ]
      },
    ],
  },
  {
    rfc: 'RFCPROFESOR2',
    name: 'Profa. María García',
    groups: [
      { 
        grade: '2', 
        group: 'A',
        students: [
          { id: '2A01', name: 'Hernández Castillo, Regina' },
          { id: '2A02', name: 'Vargas Mendoza, Matías' },
          { id: '2A03', name: 'Jiménez Ortiz, Ximena' },
          { id: '2A04', name: 'Torres Ruiz, Diego' },
        ]
      },
    ],
  },
  {
    rfc: 'RFCPROFESOR3',
    name: 'Prof. José Luis Ramírez',
    groups: [
      { 
        grade: '3', 
        group: 'C',
        students: [
          { id: '3C01', name: 'Sánchez Navarro, Renata' },
          { id: '3C02', name: 'Mendoza Guzmán, Sebastián' },
          { id: '3C03', name: 'Rojas Aguilar, María José' },
          { id: '3C04', name: 'Guerrero Paredes, Alejandro' },
          { id: '3C05', name: 'Luna Ríos, Victoria' },
        ]
      },
    ],
  },
   {
    rfc: 'ADMIN',
    name: 'Administrador',
    groups: [],
  },
];
