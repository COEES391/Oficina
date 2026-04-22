
export type SchoolInfo = {
  cct: string;
  nombre: string;
  municipio: string;
  zonaEscolar: string;
  sector: string;
  region: string;
  valle: string;
  modalidad: string;
};

// Datos extraídos y representativos de la imagen del catálogo proporcionada
export const schoolsDirectory: SchoolInfo[] = [
  {
    cct: '15EES0001Z',
    nombre: 'ESC. SEC. OFIC. NO. 0001 "MIGUEL HIDALGO Y COSTILLA"',
    municipio: 'TOLUCA',
    zonaEscolar: '012',
    sector: '01',
    region: 'I',
    valle: 'TOLUCA',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0002Y',
    nombre: 'ESC. SEC. OFIC. NO. 0002 "LIC. ADOLFO LÓPEZ MATEOS"',
    municipio: 'TOLUCA',
    zonaEscolar: '012',
    sector: '01',
    region: 'I',
    valle: 'TOLUCA',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0100H',
    nombre: 'ESC. SEC. OFIC. NO. 0100 "IGNACIO MANUEL ALTAMIRANO"',
    municipio: 'METEPEC',
    zonaEscolar: '005',
    sector: '02',
    region: 'I',
    valle: 'TOLUCA',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0245W',
    nombre: 'ESC. SEC. OFIC. NO. 0245 "ERNESTO MONTES DE OCA"',
    municipio: 'ZINACANTEPEC',
    zonaEscolar: '008',
    sector: '01',
    region: 'I',
    valle: 'TOLUCA',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0512L',
    nombre: 'ESC. SEC. OFIC. NO. 0512 "DR. JORGE JIMÉNEZ CANTÚ"',
    municipio: 'LERMA',
    zonaEscolar: '015',
    sector: '03',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0789M',
    nombre: 'ESC. SEC. OFIC. NO. 0789 "CULTURA TLATILCA"',
    municipio: 'NAUCALPAN',
    zonaEscolar: '022',
    sector: '04',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  }
];
