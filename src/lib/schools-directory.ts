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

// Catálogo expandido con representación de los municipios del Estado de México
export const schoolsDirectory: SchoolInfo[] = [
  // ACAMBAY
  { cct: '15EES0001Z', nombre: 'SEC. OFIC. NO. 0001 "MIGUEL HIDALGO"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0542K', nombre: 'SEC. OFIC. NO. 0542 "JUAN ESCUTIA"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // ACOLMAN
  { cct: '15EES0002Y', nombre: 'SEC. OFIC. NO. 0002 "BENITO JUAREZ"', municipio: 'ACOLMAN', zonaEscolar: '005', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15ETV0123A', nombre: 'TELESECUNDARIA NO. 0123', municipio: 'ACOLMAN', zonaEscolar: '045', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  // ALMOLOYA DE JUAREZ
  { cct: '15EES0005V', nombre: 'SEC. OFIC. NO. 0005 "CUAUHTEMOC"', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '008', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0045X', nombre: 'SEC. TEC. NO. 0045', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '012', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'TECNICA' },
  // AMECAMECA
  { cct: '15EES0009R', nombre: 'SEC. OFIC. NO. 0009 "SOR JUANA"', municipio: 'AMECAMECA', zonaEscolar: '025', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // ATIZAPAN DE ZARAGOZA
  { cct: '15EES0013D', nombre: 'SEC. OFIC. NO. 0013 "IZCALLI"', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '045', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0112U', nombre: 'SEC. TEC. NO. 0112', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '015', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'TECNICA' },
  // ATLACOMULCO
  { cct: '15EES0014C', nombre: 'SEC. OFIC. NO. 0014 "ATLACOMULCO"', municipio: 'ATLACOMULCO', zonaEscolar: '050', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15ETV0567Z', nombre: 'TELESECUNDARIA NO. 0567', municipio: 'ATLACOMULCO', zonaEscolar: '022', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // COACALCO
  { cct: '15EES0020W', nombre: 'SEC. OFIC. NO. 0020 "COACALCO"', municipio: 'COACALCO DE BERRIOZABAL', zonaEscolar: '080', sector: '06', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  // CUAUTITLAN IZCALLI
  { cct: '15EES0025R', nombre: 'SEC. OFIC. NO. 0025 "IZCALLI"', municipio: 'CUAUTITLAN IZCALLI', zonaEscolar: '105', sector: '08', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0089K', nombre: 'SEC. TEC. NO. 0089', municipio: 'CUAUTITLAN IZCALLI', zonaEscolar: '020', sector: '08', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  // CHALCO
  { cct: '15EES0104Z', nombre: 'SEC. OFIC. NO. 0104 "CHALCO"', municipio: 'VALLE DE CHALCO SOLIDARIDAD', zonaEscolar: '495', sector: '10', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // ECATEPEC
  { cct: '15EES0027P', nombre: 'SEC. OFIC. NO. 0027 "ECATEPEC"', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '115', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0890A', nombre: 'SEC. OFIC. NO. 0890', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '115', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0012Z', nombre: 'SEC. TEC. NO. 0012', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '030', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  { cct: '15ETV0901X', nombre: 'TELESECUNDARIA NO. 0901', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '050', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  // HUIXQUILUCAN
  { cct: '15EES0031B', nombre: 'SEC. OFIC. NO. 0031 "HUIXQUILUCAN"', municipio: 'HUIXQUILUCAN', zonaEscolar: '135', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // IXTAPALUCA
  { cct: '15EES0033Z', nombre: 'SEC. OFIC. NO. 0033 "IXTAPALUCA"', municipio: 'IXTAPALUCA', zonaEscolar: '145', sector: '10', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // LERMA
  { cct: '15EES0044E', nombre: 'SEC. OFIC. NO. 0044 "LERMA"', municipio: 'LERMA', zonaEscolar: '200', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // METEPEC
  { cct: '15EES0048A', nombre: 'SEC. OFIC. NO. 0048 "METEPEC"', municipio: 'METEPEC', zonaEscolar: '220', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // NAUCALPAN
  { cct: '15EES0051N', nombre: 'SEC. OFIC. NO. 0051 "NAUCALPAN"', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '235', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0023O', nombre: 'SEC. TEC. NO. 0023', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '040', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'TECNICA' },
  // NEZAHUALCOYOTL
  { cct: '15EES0053L', nombre: 'SEC. OFIC. NO. 0053 "NEZA"', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '245', sector: '11', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0001X', nombre: 'SEC. TEC. NO. 0001', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '010', sector: '11', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  // NICOLAS ROMERO
  { cct: '15EES0054K', nombre: 'SEC. OFIC. NO. 0054 "ROMERO"', municipio: 'NICOLAS ROMERO', zonaEscolar: '250', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // SAN MATEO ATENCO
  { cct: '15EES0069M', nombre: 'SEC. OFIC. NO. 0069 "MATEO"', municipio: 'SAN MATEO ATENCO', zonaEscolar: '325', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // TECAMAC
  { cct: '15EES0074X', nombre: 'SEC. OFIC. NO. 0074 "TECAMAC"', municipio: 'TECAMAC', zonaEscolar: '350', sector: '09', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  // TLALNEPANTLA
  { cct: '15EES0095I', nombre: 'SEC. OFIC. NO. 0095 "TLALNEPANTLA"', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '455', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0034K', nombre: 'SEC. TEC. NO. 0034', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '050', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'TECNICA' },
  // TOLUCA
  { cct: '15EES0097G', nombre: 'SEC. OFIC. NO. 0097 "TOLUCA"', municipio: 'TOLUCA', zonaEscolar: '465', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0001Z', nombre: 'SEC. OFIC. NO. 0001', municipio: 'TOLUCA', zonaEscolar: '465', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EST0005T', nombre: 'SEC. TEC. NO. 0005', municipio: 'TOLUCA', zonaEscolar: '005', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15ETV0001M', nombre: 'TELESECUNDARIA NO. 0001', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  { cct: '15ETV0194A', nombre: 'TELESECUNDARIA NO. 0194', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  // TULTITLAN
  { cct: '15EES0102B', nombre: 'SEC. OFIC. NO. 0102 "TULTITLAN"', municipio: 'TULTITLAN', zonaEscolar: '485', sector: '06', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EST0056V', nombre: 'SEC. TEC. NO. 0056', municipio: 'TULTITLAN', zonaEscolar: '060', sector: '06', region: 'IV', valle: 'MEXICO', modalidad: 'TECNICA' },
  // ZINACANTEPEC
  { cct: '15EES0113G', nombre: 'SEC. OFIC. NO. 0113 "ZINACANTEPEC"', municipio: 'ZINACANTEPEC', zonaEscolar: '540', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15ETV0540F', nombre: 'TELESECUNDARIA NO. 0540', municipio: 'ZINACANTEPEC', zonaEscolar: '005', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
];
