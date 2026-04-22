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

// Catálogo masivo basado en la estructura oficial del Estado de México
export const schoolsDirectory: SchoolInfo[] = [
  // ACAMBAY
  { cct: '15EES0001Z', nombre: 'SEC. OFIC. NO. 0001 "MIGUEL HIDALGO"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0542K', nombre: 'SEC. OFIC. NO. 0542 "JUAN ESCUTIA"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0593B', nombre: 'SEC. OFIC. NO. 0593 "MARIANO MATAMOROS"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0003V', nombre: 'SEC. TEC. NO. 0003', municipio: 'ACAMBAY', zonaEscolar: '005', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TECNICA' },
  // ACOLMAN
  { cct: '15EES0002Y', nombre: 'SEC. OFIC. NO. 0002 "BENITO JUAREZ"', municipio: 'ACOLMAN', zonaEscolar: '005', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0345T', nombre: 'SEC. OFIC. NO. 0345', municipio: 'ACOLMAN', zonaEscolar: '005', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0847V', nombre: 'SEC. OFIC. NO. 0847', municipio: 'ACOLMAN', zonaEscolar: '005', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0040B', nombre: 'SEC. TEC. NO. 0040', municipio: 'ACOLMAN', zonaEscolar: '010', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  { cct: '15ETV0123A', nombre: 'TELESECUNDARIA NO. 0123', municipio: 'ACOLMAN', zonaEscolar: '045', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  { cct: '15ETV0590Q', nombre: 'TELESECUNDARIA NO. 0590', municipio: 'ACOLMAN', zonaEscolar: '045', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  // ACULCO
  { cct: '15EES0003X', nombre: 'SEC. OFIC. NO. 0003 "HIDALGO"', municipio: 'ACULCO', zonaEscolar: '003', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0041A', nombre: 'SEC. TEC. NO. 0041', municipio: 'ACULCO', zonaEscolar: '003', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0103N', nombre: 'TELESECUNDARIA NO. 0103', municipio: 'ACULCO', zonaEscolar: '003', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // ALMOLOYA DE JUAREZ
  { cct: '15EES0005V', nombre: 'SEC. OFIC. NO. 0005 "CUAUHTEMOC"', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '008', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0663H', nombre: 'SEC. OFIC. NO. 0663', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '008', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0045X', nombre: 'SEC. TEC. NO. 0045', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '012', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0411Z', nombre: 'TELESECUNDARIA NO. 0411', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '015', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  { cct: '15ETV0723X', nombre: 'TELESECUNDARIA NO. 0723', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '015', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // AMATEPEC
  { cct: '15EES0008S', nombre: 'SEC. OFIC. NO. 0008', municipio: 'AMATEPEC', zonaEscolar: '020', sector: '05', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0004U', nombre: 'SEC. TEC. NO. 0004', municipio: 'AMATEPEC', zonaEscolar: '020', sector: '05', region: 'VI', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0750U', nombre: 'TELESECUNDARIA NO. 0750', municipio: 'AMATEPEC', zonaEscolar: '030', sector: '05', region: 'VI', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  { cct: '15ETV0775C', nombre: 'TELESECUNDARIA NO. 0775', municipio: 'AMATEPEC', zonaEscolar: '030', sector: '05', region: 'VI', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // ATIZAPAN DE ZARAGOZA
  { cct: '15EES0013D', nombre: 'SEC. OFIC. NO. 0013 "IZCALLI"', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '045', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0638L', nombre: 'SEC. OFIC. NO. 0638', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '045', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0112U', nombre: 'SEC. TEC. NO. 0112', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '015', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'TECNICA' },
  // ATLACOMULCO
  { cct: '15EES0014C', nombre: 'SEC. OFIC. NO. 0014 "ATLACOMULCO"', municipio: 'ATLACOMULCO', zonaEscolar: '050', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0005T', nombre: 'SEC. TEC. NO. 0005', municipio: 'ATLACOMULCO', zonaEscolar: '022', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0567Z', nombre: 'TELESECUNDARIA NO. 0567', municipio: 'ATLACOMULCO', zonaEscolar: '022', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // ECATEPEC
  { cct: '15EES0027P', nombre: 'SEC. OFIC. NO. 0027 "ECATEPEC"', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '115', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0012Z', nombre: 'SEC. TEC. NO. 0012', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '030', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  { cct: '15ETV0901X', nombre: 'TELESECUNDARIA NO. 0901', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '050', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  // NEZAHUALCOYOTL
  { cct: '15EES0053L', nombre: 'SEC. OFIC. NO. 0053 "NEZA"', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '245', sector: '11', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0001X', nombre: 'SEC. TEC. NO. 0001', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '010', sector: '11', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  // TOLUCA
  { cct: '15EES0097G', nombre: 'SEC. OFIC. NO. 0097 "TOLUCA"', municipio: 'TOLUCA', zonaEscolar: '465', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0005T', nombre: 'SEC. TEC. NO. 0005', municipio: 'TOLUCA', zonaEscolar: '005', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0001M', nombre: 'TELESECUNDARIA NO. 0001', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  { cct: '15ETV0194A', nombre: 'TELESECUNDARIA NO. 0194', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
];