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
  // A
  { cct: '15EES0001Z', nombre: 'SEC. OFIC. NO. 0001 "MIGUEL HIDALGO"', municipio: 'ACAMBAY', zonaEscolar: '001', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0002Y', nombre: 'SEC. OFIC. NO. 0002 "BENITO JUAREZ"', municipio: 'ACOLMAN', zonaEscolar: '005', sector: '02', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0003X', nombre: 'SEC. OFIC. NO. 0003 "IGNACIO ZARAGOZA"', municipio: 'ACULCO', zonaEscolar: '002', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0004W', nombre: 'SEC. OFIC. NO. 0004 "JOSEFA ORTIZ"', municipio: 'ALMOLOYA DE ALQUISIRAS', zonaEscolar: '010', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0005V', nombre: 'SEC. OFIC. NO. 0005 "CUAUHTEMOC"', municipio: 'ALMOLOYA DE JUAREZ', zonaEscolar: '008', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0006U', nombre: 'SEC. OFIC. NO. 0006 "NIÑOS HEROES"', municipio: 'ALMOLOYA DEL RIO', zonaEscolar: '015', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0007T', nombre: 'SEC. OFIC. NO. 0007 "MORELOS"', municipio: 'AMANALCO', zonaEscolar: '012', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0008S', nombre: 'SEC. OFIC. NO. 0008 "LAZARO CARDENAS"', municipio: 'AMATEPEC', zonaEscolar: '020', sector: '03', region: 'IX', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0009R', nombre: 'SEC. OFIC. NO. 0009 "SOR JUANA"', municipio: 'AMECAMECA', zonaEscolar: '025', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0010G', nombre: 'SEC. OFIC. NO. 0010 "REVOLUCION"', municipio: 'APAXCO', zonaEscolar: '030', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0011F', nombre: 'SEC. OFIC. NO. 0011 "LIBERTAD"', municipio: 'ATENCO', zonaEscolar: '035', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0012E', nombre: 'SEC. OFIC. NO. 0012 "PATRIA"', municipio: 'ATIZAPAN', zonaEscolar: '040', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0013D', nombre: 'SEC. OFIC. NO. 0013 "IZCALLI"', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '045', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0014C', nombre: 'SEC. OFIC. NO. 0014 "ATLACOMULCO"', municipio: 'ATLACOMULCO', zonaEscolar: '050', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0015B', nombre: 'SEC. OFIC. NO. 0015 "VOLCANES"', municipio: 'ATLAUTLA', zonaEscolar: '055', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0016A', nombre: 'SEC. OFIC. NO. 0016 "PIRAMIDES"', municipio: 'AXAPUSCO', zonaEscolar: '060', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0017Z', nombre: 'SEC. OFIC. NO. 0017 "AYAPANGO"', municipio: 'AYAPANGO', zonaEscolar: '065', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // C
  { cct: '15EES0018Y', nombre: 'SEC. OFIC. NO. 0018 "CALIMAYA"', municipio: 'CALIMAYA', zonaEscolar: '070', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0019X', nombre: 'SEC. OFIC. NO. 0019 "CAPULHUAC"', municipio: 'CAPULHUAC', zonaEscolar: '075', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0020W', nombre: 'SEC. OFIC. NO. 0020 "COACALCO"', municipio: 'COACALCO DE BERRIOZABAL', zonaEscolar: '080', sector: '06', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0021V', nombre: 'SEC. OFIC. NO. 0021 "COATEPEC"', municipio: 'COATEPEC HARINAS', zonaEscolar: '085', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0022U', nombre: 'SEC. OFIC. NO. 0022 "COCOTITLAN"', municipio: 'COCOTITLAN', zonaEscolar: '090', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0023T', nombre: 'SEC. OFIC. NO. 0023 "COYOTEPEC"', municipio: 'COYOTEPEC', zonaEscolar: '095', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0024S', nombre: 'SEC. OFIC. NO. 0024 "CUAUTITLAN"', municipio: 'CUAUTITLAN', zonaEscolar: '100', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0025R', nombre: 'SEC. OFIC. NO. 0025 "IZCALLI"', municipio: 'CUAUTITLAN IZCALLI', zonaEscolar: '105', sector: '08', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  // D
  { cct: '15EES0026Q', nombre: 'SEC. OFIC. NO. 0026 "DONATO"', municipio: 'DONATO GUERRA', zonaEscolar: '110', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // E
  { cct: '15EES0027P', nombre: 'SEC. OFIC. NO. 0027 "ECATEPEC"', municipio: 'ECATEPEC DE MORELOS', zonaEscolar: '115', sector: '12', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0028O', nombre: 'SEC. OFIC. NO. 0028 "ECATZINGO"', municipio: 'ECATZINGO', zonaEscolar: '120', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // H
  { cct: '15EES0029N', nombre: 'SEC. OFIC. NO. 0029 "HUEHUETOCA"', municipio: 'HUEHUETOCA', zonaEscolar: '125', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0030C', nombre: 'SEC. OFIC. NO. 0030 "HUEYPOXTLA"', municipio: 'HUEYPOXTLA', zonaEscolar: '130', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0031B', nombre: 'SEC. OFIC. NO. 0031 "HUIXQUILUCAN"', municipio: 'HUIXQUILUCAN', zonaEscolar: '135', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // I
  { cct: '15EES0032A', nombre: 'SEC. OFIC. NO. 0032 "FABELA"', municipio: 'ISIDRO FABELA', zonaEscolar: '140', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0033Z', nombre: 'SEC. OFIC. NO. 0033 "IXTAPALUCA"', municipio: 'IXTAPALUCA', zonaEscolar: '145', sector: '10', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0034Y', nombre: 'SEC. OFIC. NO. 0034 "IXTAPAN"', municipio: 'IXTAPAN DE LA SAL', zonaEscolar: '150', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0035X', nombre: 'SEC. OFIC. NO. 0035 "ORO"', municipio: 'IXTAPAN DEL ORO', zonaEscolar: '155', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0036W', nombre: 'SEC. OFIC. NO. 0036 "IXTLAHUACA"', municipio: 'IXTLAHUACA', zonaEscolar: '160', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // J
  { cct: '15EES0037V', nombre: 'SEC. OFIC. NO. 0037 "JALTENCO"', municipio: 'JALTENCO', zonaEscolar: '165', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0038U', nombre: 'SEC. OFIC. NO. 0038 "JILOTEPEC"', municipio: 'JILOTEPEC', zonaEscolar: '170', sector: '06', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0039T', nombre: 'SEC. OFIC. NO. 0039 "JILOTZINGO"', municipio: 'JILOTZINGO', zonaEscolar: '175', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0040I', nombre: 'SEC. OFIC. NO. 0040 "JIQUIPILCO"', municipio: 'JIQUIPILCO', zonaEscolar: '180', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0041H', nombre: 'SEC. OFIC. NO. 0041 "JOCOTITLAN"', municipio: 'JOCOTITLAN', zonaEscolar: '185', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0042G', nombre: 'SEC. OFIC. NO. 0042 "JOQUICINGO"', municipio: 'JOQUICINGO', zonaEscolar: '190', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0043F', nombre: 'SEC. OFIC. NO. 0043 "JUCHITEPEC"', municipio: 'JUCHITEPEC', zonaEscolar: '195', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // L
  { cct: '15EES0044E', nombre: 'SEC. OFIC. NO. 0044 "LERMA"', municipio: 'LERMA', zonaEscolar: '200', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0045D', nombre: 'SEC. OFIC. NO. 0045 "LUVIANOS"', municipio: 'LUVIANOS', zonaEscolar: '205', sector: '03', region: 'IX', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // M
  { cct: '15EES0046C', nombre: 'SEC. OFIC. NO. 0046 "MALINALCO"', municipio: 'MALINALCO', zonaEscolar: '210', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0047B', nombre: 'SEC. OFIC. NO. 0047 "OCAMPO"', municipio: 'MELCHOR OCAMPO', zonaEscolar: '215', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0048A', nombre: 'SEC. OFIC. NO. 0048 "METEPEC"', municipio: 'METEPEC', zonaEscolar: '220', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0049Z', nombre: 'SEC. OFIC. NO. 0049 "MEXICALTZINGO"', municipio: 'MEXICALTZINGO', zonaEscolar: '225', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0050O', nombre: 'SEC. OFIC. NO. 0050 "MORELOS"', municipio: 'MORELOS', zonaEscolar: '230', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // N
  { cct: '15EES0051N', nombre: 'SEC. OFIC. NO. 0051 "NAUCALPAN"', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '235', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0052M', nombre: 'SEC. OFIC. NO. 0052 "NEXTLALPAN"', municipio: 'NEXTLALPAN', zonaEscolar: '240', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0053L', nombre: 'SEC. OFIC. NO. 0053 "NEZA"', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '245', sector: '11', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0054K', nombre: 'SEC. OFIC. NO. 0054 "ROMERO"', municipio: 'NICOLAS ROMERO', zonaEscolar: '250', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0055J', nombre: 'SEC. OFIC. NO. 0055 "NOPALTEPEC"', municipio: 'NOPALTEPEC', zonaEscolar: '255', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  // O
  { cct: '15EES0056I', nombre: 'SEC. OFIC. NO. 0056 "OCOYOACAC"', municipio: 'OCOYOACAC', zonaEscolar: '260', sector: '03', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0057H', nombre: 'SEC. OFIC. NO. 0057 "OCUILAN"', municipio: 'OCUILAN', zonaEscolar: '265', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0058G', nombre: 'SEC. OFIC. NO. 0058 "ORO"', municipio: 'EL ORO', zonaEscolar: '270', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0059F', nombre: 'SEC. OFIC. NO. 0059 "OTZOLOAPAN"', municipio: 'OTZOLOAPAN', zonaEscolar: '275', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0060V', nombre: 'SEC. OFIC. NO. 0060 "OTZOLOTEPEC"', municipio: 'OTZOLOTEPEC', zonaEscolar: '280', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0061U', nombre: 'SEC. OFIC. NO. 0061 "OZUMBA"', municipio: 'OZUMBA', zonaEscolar: '285', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  // P
  { cct: '15EES0062T', nombre: 'SEC. OFIC. NO. 0062 "PAPALOTLA"', municipio: 'PAPALOTLA', zonaEscolar: '290', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0063S', nombre: 'SEC. OFIC. NO. 0063 "PAZ"', municipio: 'LA PAZ', zonaEscolar: '295', sector: '10', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0064R', nombre: 'SEC. OFIC. NO. 0064 "POLOTITLAN"', municipio: 'POLOTITLAN', zonaEscolar: '300', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // R
  { cct: '15EES0065Q', nombre: 'SEC. OFIC. NO. 0065 "RAYON"', municipio: 'RAYON', zonaEscolar: '305', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // S
  { cct: '15EES0066P', nombre: 'SEC. OFIC. NO. 0066 "ANTONIO"', municipio: 'SAN ANTONIO LA ISLA', zonaEscolar: '310', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0067O', nombre: 'SEC. OFIC. NO. 0067 "FELIPE"', municipio: 'SAN FELIPE DEL PROGRESO', zonaEscolar: '315', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0068N', nombre: 'SEC. OFIC. NO. 0068 "MARTIN"', municipio: 'SAN MARTIN DE LAS PIRAMIDES', zonaEscolar: '320', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0069M', nombre: 'SEC. OFIC. NO. 0069 "MATEO"', municipio: 'SAN MATEO ATENCO', zonaEscolar: '325', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0070B', nombre: 'SEC. OFIC. NO. 0070 "SIMON"', municipio: 'SAN SIMON DE GUERRERO', zonaEscolar: '330', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0071A', nombre: 'SEC. OFIC. NO. 0071 "TOMAS"', municipio: 'SANTO TOMAS', zonaEscolar: '335', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0072Z', nombre: 'SEC. OFIC. NO. 0072 "SOYANIQUILPAN"', municipio: 'SOYANIQUILPAN DE JUAREZ', zonaEscolar: '340', sector: '06', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0073Y', nombre: 'SEC. OFIC. NO. 0073 "SULTEPEC"', municipio: 'SULTEPEC', zonaEscolar: '345', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // T
  { cct: '15EES0074X', nombre: 'SEC. OFIC. NO. 0074 "TECAMAC"', municipio: 'TECAMAC', zonaEscolar: '350', sector: '09', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0075W', nombre: 'SEC. OFIC. NO. 0075 "TEJUPILCO"', municipio: 'TEJUPILCO', zonaEscolar: '355', sector: '03', region: 'IX', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0076V', nombre: 'SEC. OFIC. NO. 0076 "TEMAMATLA"', municipio: 'TEMAMATLA', zonaEscolar: '360', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0077U', nombre: 'SEC. OFIC. NO. 0077 "TEMASCALAPA"', municipio: 'TEMASCALAPA', zonaEscolar: '365', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0078T', nombre: 'SEC. OFIC. NO. 0078 "TEMASCALCINGO"', municipio: 'TEMASCALCINGO', zonaEscolar: '370', sector: '01', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0079S', nombre: 'SEC. OFIC. NO. 0079 "TEMASCALTEPEC"', municipio: 'TEMASCALTEPEC', zonaEscolar: '375', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0080H', nombre: 'SEC. OFIC. NO. 0080 "TEMOAYA"', municipio: 'TEMOAYA', zonaEscolar: '380', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0081G', nombre: 'SEC. OFIC. NO. 0081 "TENANCINGO"', municipio: 'TENANCINGO', zonaEscolar: '385', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0082F', nombre: 'SEC. OFIC. NO. 0082 "AIRE"', municipio: 'TENANGO DEL AIRE', zonaEscolar: '390', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0083E', nombre: 'SEC. OFIC. NO. 0083 "VALLE"', municipio: 'TENANGO DEL VALLE', zonaEscolar: '395', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0084D', nombre: 'SEC. OFIC. NO. 0084 "TEOLOYUCAN"', municipio: 'TEOLOYUCAN', zonaEscolar: '400', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0085C', nombre: 'SEC. OFIC. NO. 0085 "TEOTIHUACAN"', municipio: 'TEOTIHUACAN', zonaEscolar: '405', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0086B', nombre: 'SEC. OFIC. NO. 0086 "TEPOTZOTLAN"', municipio: 'TEPOTZOTLAN', zonaEscolar: '410', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0087A', nombre: 'SEC. OFIC. NO. 0087 "TEPETLIXPA"', municipio: 'TEPETLIXPA', zonaEscolar: '415', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0088Z', nombre: 'SEC. OFIC. NO. 0088 "TEPETLAOXTOC"', municipio: 'TEPETLAOXTOC', zonaEscolar: '420', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0089Y', nombre: 'SEC. OFIC. NO. 0089 "TEXCALTITLAN"', municipio: 'TEXCALTITLAN', zonaEscolar: '425', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0090N', nombre: 'SEC. OFIC. NO. 0090 "TEXCALYACAC"', municipio: 'TEXCALYACAC', zonaEscolar: '430', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0091M', nombre: 'SEC. OFIC. NO. 0091 "TEXCOCO"', municipio: 'TEXCOCO', zonaEscolar: '435', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0092L', nombre: 'SEC. OFIC. NO. 0092 "TEZOYUCA"', municipio: 'TEZOYUCA', zonaEscolar: '440', sector: '07', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0093K', nombre: 'SEC. OFIC. NO. 0093 "TIANGUISTENCO"', municipio: 'TIANGUISTENCO', zonaEscolar: '445', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0094J', nombre: 'SEC. OFIC. NO. 0094 "TLALMANALCO"', municipio: 'TLALMANALCO', zonaEscolar: '450', sector: '05', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0095I', nombre: 'SEC. OFIC. NO. 0095 "TLALNEPANTLA"', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '455', sector: '08', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0096H', nombre: 'SEC. OFIC. NO. 0096 "TLATLAYA"', municipio: 'TLATLAYA', zonaEscolar: '460', sector: '03', region: 'IX', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0097G', nombre: 'SEC. OFIC. NO. 0097 "TOLUCA"', municipio: 'TOLUCA', zonaEscolar: '465', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0098F', nombre: 'SEC. OFIC. NO. 0098 "TONATICO"', municipio: 'TONATICO', zonaEscolar: '470', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0099E', nombre: 'SEC. OFIC. NO. 0099 "TONANITLA"', municipio: 'TONANITLA', zonaEscolar: '475', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0101C', nombre: 'SEC. OFIC. NO. 0101 "TULTEPEC"', municipio: 'TULTEPEC', zonaEscolar: '480', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0102B', nombre: 'SEC. OFIC. NO. 0102 "TULTITLAN"', municipio: 'TULTITLAN', zonaEscolar: '485', sector: '06', region: 'IV', valle: 'MEXICO', modalidad: 'GENERAL' },
  // V
  { cct: '15EES0103A', nombre: 'SEC. OFIC. NO. 0103 "BRAVO"', municipio: 'VALLE DE BRAVO', zonaEscolar: '490', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0104Z', nombre: 'SEC. OFIC. NO. 0104 "CHALCO"', municipio: 'VALLE DE CHALCO SOLIDARIDAD', zonaEscolar: '495', sector: '10', region: 'V', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15EES0105Y', nombre: 'SEC. OFIC. NO. 0105 "ALLENDE"', municipio: 'VILLA DE ALLENDE', zonaEscolar: '500', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0106X', nombre: 'SEC. OFIC. NO. 0106 "CARBON"', municipio: 'VILLA DEL CARBON', zonaEscolar: '505', sector: '06', region: 'II', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0107W', nombre: 'SEC. OFIC. NO. 0107 "GUERRERO"', municipio: 'VILLA GUERRERO', zonaEscolar: '510', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0108V', nombre: 'SEC. OFIC. NO. 0108 "VICTORIA"', municipio: 'VILLA VICTORIA', zonaEscolar: '515', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // X
  { cct: '15EES0109U', nombre: 'SEC. OFIC. NO. 0109 "XALATLACO"', municipio: 'XALATLACO', zonaEscolar: '520', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0110J', nombre: 'SEC. OFIC. NO. 0110 "XONACATLAN"', municipio: 'XONACATLAN', zonaEscolar: '525', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  // Z
  { cct: '15EES0111I', nombre: 'SEC. OFIC. NO. 0111 "ZACAZONAPAN"', municipio: 'ZACAZONAPAN', zonaEscolar: '530', sector: '01', region: 'VII', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0112H', nombre: 'SEC. OFIC. NO. 0112 "ZACUALPAN"', municipio: 'ZACUALPAN', zonaEscolar: '535', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0113G', nombre: 'SEC. OFIC. NO. 0113 "ZINACANTEPEC"', municipio: 'ZINACANTEPEC', zonaEscolar: '540', sector: '01', region: 'I', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0114F', nombre: 'SEC. OFIC. NO. 0114 "ZUMPAHUACAN"', municipio: 'ZUMPAHUACAN', zonaEscolar: '545', sector: '03', region: 'VI', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15EES0115E', nombre: 'SEC. OFIC. NO. 0115 "ZUMPANGO"', municipio: 'ZUMPANGO', zonaEscolar: '550', sector: '06', region: 'III', valle: 'MEXICO', modalidad: 'GENERAL' },
];
