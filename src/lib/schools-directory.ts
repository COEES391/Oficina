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

// Catálogo expandido con representación de diversos municipios del Estado de México
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
  },
  {
    cct: '15DST0001X',
    nombre: 'ESC. SEC. TEC. NO. 1 "XICOHTENCATL"',
    municipio: 'ECATEPEC DE MORELOS',
    zonaEscolar: '003',
    sector: '05',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'TECNICA'
  },
  {
    cct: '15DST0045A',
    nombre: 'ESC. SEC. TEC. NO. 45 "SOR JUANA INÉS DE LA CRUZ"',
    municipio: 'NEZAHUALCÓYOTL',
    zonaEscolar: '007',
    sector: '05',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'TECNICA'
  },
  {
    cct: '15ETV0012C',
    nombre: 'TELESECUNDARIA NO. 12 "EMILIANO ZAPATA"',
    municipio: 'IXTAPALUCA',
    zonaEscolar: '018',
    sector: '08',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'TELESECUNDARIA'
  },
  {
    cct: '15ETV0098T',
    nombre: 'TELESECUNDARIA NO. 98 "JOSÉ VASCONCELOS"',
    municipio: 'CHIMALHUACÁN',
    zonaEscolar: '020',
    sector: '08',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'TELESECUNDARIA'
  },
  {
    cct: '15EES0801A',
    nombre: 'ESC. SEC. OFIC. NO. 0801 "TOLTECA"',
    municipio: 'TLALNEPANTLA DE BAZ',
    zonaEscolar: '025',
    sector: '04',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  },
  {
    cct: '15DST0112K',
    nombre: 'ESC. SEC. TEC. NO. 112 "GENERAL FELIPE ÁNGELES"',
    municipio: 'TULTITLÁN',
    zonaEscolar: '009',
    sector: '06',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'TECNICA'
  },
  {
    cct: '15EES0905M',
    nombre: 'ESC. SEC. OFIC. NO. 0905 "QUETZALCOATL"',
    municipio: 'CUAUTITLÁN IZCALLI',
    zonaEscolar: '030',
    sector: '04',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  },
  {
    cct: '15DST0200J',
    nombre: 'ESC. SEC. TEC. NO. 200 "REVOLUCIÓN MEXICANA"',
    municipio: 'ATIZAPÁN DE ZARAGOZA',
    zonaEscolar: '015',
    sector: '04',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'TECNICA'
  },
  {
    cct: '15ETV0500P',
    nombre: 'TELESECUNDARIA NO. 500 "BENITO JUÁREZ"',
    municipio: 'TECÁMAC',
    zonaEscolar: '040',
    sector: '09',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'TELESECUNDARIA'
  },
  {
    cct: '15EES0120W',
    nombre: 'ESC. SEC. OFIC. NO. 0120 "LIBERTADORES"',
    municipio: 'VALLE DE CHALCO SOLIDARIDAD',
    zonaEscolar: '045',
    sector: '10',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  },
  {
    cct: '15EES0300G',
    nombre: 'ESC. SEC. OFIC. NO. 0300 "VICENTE GUERRERO"',
    municipio: 'COACALCO DE BERRIOZÁBAL',
    zonaEscolar: '050',
    sector: '06',
    region: 'IV',
    valle: 'MEXICO',
    modalidad: 'GENERAL'
  },
  {
    cct: '15DST0310L',
    nombre: 'ESC. SEC. TEC. NO. 310 "MÉXICO 68"',
    municipio: 'NICOLÁS ROMERO',
    zonaEscolar: '055',
    sector: '04',
    region: 'V',
    valle: 'MEXICO',
    modalidad: 'TECNICA'
  }
];
