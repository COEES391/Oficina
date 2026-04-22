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

const mapValle = (v: string) => v === 'T' ? 'TOLUCA' : 'MEXICO';
const mapModalidad = (m: string) => {
  if (m === 'DES') return 'GENERAL';
  if (m === 'DST') return 'TECNICA';
  if (m === 'DTV') return 'TELESECUNDARIA';
  return m;
};

// Catálogo completo basado en la tabla proporcionada por el usuario
export const schoolsDirectory: SchoolInfo[] = [
  // ADG
  { cct: '15ADG0001Q', nombre: 'CCT 15ADG0001Q', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0002P', nombre: 'CCT 15ADG0002P', municipio: 'ECATEPEC', zonaEscolar: '000', sector: '00', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0004N', nombre: 'CCT 15ADG0004N', municipio: 'TULTITLAN', zonaEscolar: '000', sector: '00', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0005M', nombre: 'CCT 15ADG0005M', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '000', sector: '00', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0007E', nombre: 'CCT 15ADG0007E', municipio: 'ECATEPEC', zonaEscolar: '000', sector: '00', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0007K', nombre: 'CCT 15ADG0007K', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0007N', nombre: 'CCT 15ADG0007N', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '000', sector: '00', region: 'NAUCALPAN', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0007Z', nombre: 'CCT 15ADG0007Z', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '000', sector: '00', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0031K', nombre: 'CCT 15ADG0031K', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0032J', nombre: 'CCT 15ADG0032J', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0033I', nombre: 'CCT 15ADG0033I', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0034H', nombre: 'CCT 15ADG0034H', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0035G', nombre: 'CCT 15ADG0035G', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0036F', nombre: 'CCT 15ADG0036F', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0037E', nombre: 'CCT 15ADG0037E', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0038D', nombre: 'CCT 15ADG0038D', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0039C', nombre: 'CCT 15ADG0039C', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0040S', nombre: 'CCT 15ADG0040S', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0041R', nombre: 'CCT 15ADG0041R', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0042Q', nombre: 'CCT 15ADG0042Q', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0043P', nombre: 'CCT 15ADG0043P', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0048K', nombre: 'CCT 15ADG0048K', municipio: 'TOLUCA', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0061E', nombre: 'CCT 15ADG0061E', municipio: 'SAN MATEO ATENCO', zonaEscolar: '000', sector: '00', region: 'LERMA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0076G', nombre: 'CCT 15ADG0076G', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0079D', nombre: 'CCT 15ADG0079D', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0080T', nombre: 'CCT 15ADG0080T', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0082R', nombre: 'CCT 15ADG0082R', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0083Q', nombre: 'CCT 15ADG0083Q', municipio: 'TULTITLAN', zonaEscolar: '000', sector: '00', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0085O', nombre: 'CCT 15ADG0085O', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '000', sector: '00', region: 'TLALNEPANTLA', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0086N', nombre: 'CCT 15ADG0086N', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '000', sector: '00', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0087M', nombre: 'CCT 15ADG0087M', municipio: 'ECATEPEC', zonaEscolar: '000', sector: '00', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0107J', nombre: 'CCT 15ADG0107J', municipio: 'SAN MATEO ATENCO', zonaEscolar: '000', sector: '00', region: 'LERMA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0112V', nombre: 'CCT 15ADG0112V', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '000', sector: '00', region: 'NAUCALPAN', valle: 'MEXICO', modalidad: 'ADG' },
  { cct: '15ADG0118P', nombre: 'CCT 15ADG0118P', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0119O', nombre: 'CCT 15ADG0119O', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0120D', nombre: 'CCT 15ADG0120D', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0121C', nombre: 'CCT 15ADG0121C', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0122B', nombre: 'CCT 15ADG0122B', municipio: 'METEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },
  { cct: '15ADG0124Z', nombre: 'CCT 15ADG0124Z', municipio: 'ZINACANTEPEC', zonaEscolar: '000', sector: '00', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'ADG' },

  // DES (SECUNDARIA GENERAL)
  { cct: '15DES0001R', nombre: 'CCT 15DES0001R', municipio: 'ATLACOMULCO', zonaEscolar: '030', sector: '08', region: 'ATLACOMULCO', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0002Q', nombre: 'CCT 15DES0002Q', municipio: 'TEXCOCO', zonaEscolar: '024', sector: '09', region: 'TEXCOCO', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0003P', nombre: 'CCT 15DES0003P', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '006', sector: '02', region: 'TLALNEPANTLA', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0004O', nombre: 'CCT 15DES0004O', municipio: 'TLALMANALCO', zonaEscolar: '023', sector: '09', region: 'AMECAMECA', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0005N', nombre: 'CCT 15DES0005N', municipio: 'NICOLAS ROMERO', zonaEscolar: '008', sector: '02', region: 'NAUCALPAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0006M', nombre: 'CCT 15DES0006M', municipio: 'VALLE DE BRAVO', zonaEscolar: '028', sector: '07', region: 'VALLE DE BRAVO', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0007L', nombre: 'CCT 15DES0007L', municipio: 'TOLUCA', zonaEscolar: '037', sector: '06', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0008K', nombre: 'CCT 15DES0008K', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '009', sector: '02', region: 'TLALNEPANTLA', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0009J', nombre: 'CCT 15DES0009J', municipio: 'IXTAPAN DE LA SAL', zonaEscolar: '027', sector: '07', region: 'IXTAPAN DE LA SAL', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0010Z', nombre: 'CCT 15DES0010Z', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '033', sector: '05', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0011Y', nombre: 'CCT 15DES0011Y', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '001', sector: '01', region: 'NAUCALPAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0012X', nombre: 'CCT 15DES0012X', municipio: 'TOLUCA', zonaEscolar: '026', sector: '06', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0013W', nombre: 'CCT 15DES0013W', municipio: 'IXTAPALUCA', zonaEscolar: '007', sector: '09', region: 'CHIMALHUACAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0014V', nombre: 'CCT 15DES0014V', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '020', sector: '05', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0015U', nombre: 'CCT 15DES0015U', municipio: 'TEOLOYUCAN', zonaEscolar: '042', sector: '03', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0016T', nombre: 'CCT 15DES0016T', municipio: 'CUAUTITLAN', zonaEscolar: '031', sector: '03', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0021E', nombre: 'CCT 15DES0021E', municipio: 'CUAUTITLAN IZCALLI', zonaEscolar: '010', sector: '03', region: 'CUAUTITLAN IZCALLI', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0022D', nombre: 'CCT 15DES0022D', municipio: 'TEMASCALCINGO', zonaEscolar: '035', sector: '08', region: 'ATLACOMULCO', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0023C', nombre: 'CCT 15DES0023C', municipio: 'ZUMPANGO', zonaEscolar: '043', sector: '03', region: 'ZUMPANGO', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0025A', nombre: 'CCT 15DES0025A', municipio: 'ECATEPEC', zonaEscolar: '016', sector: '04', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0026Z', nombre: 'CCT 15DES0026Z', municipio: 'ZINACANTEPEC', zonaEscolar: '026', sector: '06', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'GENERAL' },
  { cct: '15DES0035H', nombre: 'CCT 15DES0035H', municipio: 'ECATEPEC', zonaEscolar: '017', sector: '04', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0036G', nombre: 'CCT 15DES0036G', municipio: 'TULTITLAN', zonaEscolar: '012', sector: '03', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0038E', nombre: 'CCT 15DES0038E', municipio: 'CHALCO', zonaEscolar: '046', sector: '09', region: 'AMECAMECA', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0039D', nombre: 'CCT 15DES0039D', municipio: 'TECAMAC', zonaEscolar: '032', sector: '04', region: 'ECATEPEC', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0041S', nombre: 'CCT 15DES0041S', municipio: 'CHICONCUAC', zonaEscolar: '044', sector: '04', region: 'TEXCOCO', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0064C', nombre: 'CCT 15DES0064C', municipio: 'COYOTEPEC', zonaEscolar: '042', sector: '03', region: 'CUAUTITLAN IZCALLI', valle: 'MEXICO', modalidad: 'GENERAL' },
  { cct: '15DES0065B', nombre: 'CCT 15DES0065B', municipio: 'AMECAMECA', zonaEscolar: '023', sector: '09', region: 'AMECAMECA', valle: 'MEXICO', modalidad: 'GENERAL' },

  // DST (SECUNDARIA TECNICA)
  { cct: '15DST0001J', nombre: 'CCT 15DST0001J', municipio: 'TIANGUISTENCO', zonaEscolar: '002', sector: '02', region: 'LERMA', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15DST0002I', nombre: 'CCT 15DST0002I', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15DST0003H', nombre: 'CCT 15DST0003H', municipio: 'TLALNEPANTLA DE BAZ', zonaEscolar: '012', sector: '04', region: 'TLALNEPANTLA', valle: 'MEXICO', modalidad: 'TECNICA' },
  { cct: '15DST0008C', nombre: 'CCT 15DST0008C', municipio: 'TEJUPILCO', zonaEscolar: '009', sector: '01', region: 'TEJUPILCO', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15DST0010R', nombre: 'CCT 15DST0010R', municipio: 'ACAMBAY', zonaEscolar: '028', sector: '03', region: 'ATLACOMULCO', valle: 'TOLUCA', modalidad: 'TECNICA' },
  { cct: '15DST0013O', nombre: 'CCT 15DST0013O', municipio: 'NAUCALPAN DE JUAREZ', zonaEscolar: '010', sector: '04', region: 'NAUCALPAN', valle: 'MEXICO', modalidad: 'TECNICA' },
  { cct: '15DST0015M', nombre: 'CCT 15DST0015M', municipio: 'COACALCO DE BERRIOZABAL', zonaEscolar: '018', sector: '05', region: 'TULTITLAN', valle: 'MEXICO', modalidad: 'TECNICA' },

  // DTV (TELESECUNDARIA)
  { cct: '15DTV0001X', nombre: 'CCT 15DTV0001X', municipio: 'ZUMPANGO', zonaEscolar: '026', sector: '06', region: 'ZUMPANGO', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  { cct: '15DTV0002W', nombre: 'CCT 15DTV0002W', municipio: 'ATENCO', zonaEscolar: '004', sector: '06', region: 'TEXCOCO', valle: 'MEXICO', modalidad: 'TELESECUNDARIA' },
  { cct: '15DTV0014A', nombre: 'CCT 15DTV0014A', municipio: 'ZINACANTEPEC', zonaEscolar: '027', sector: '09', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  { cct: '15DTV0025G', nombre: 'CCT 15DTV0025G', municipio: 'TOLUCA', zonaEscolar: '028', sector: '09', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'TELESECUNDARIA' },
  
  // FIS, FJE, FJT, FTS, FTV, FZF, FZT (Otros servicios)
  { cct: '15FIS0001L', nombre: 'CCT 15FIS0001L', municipio: 'ATIZAPAN DE ZARAGOZA', zonaEscolar: '009', sector: '02', region: 'TLALNEPANTLA', valle: 'MEXICO', modalidad: 'FIS' },
  { cct: '15FJE0009Q', nombre: 'CCT 15FJE0009Q', municipio: 'TOLUCA', zonaEscolar: '000', sector: '06', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'FJE' },
  { cct: '15FJT0001Q', nombre: 'CCT 15FJT0001Q', municipio: 'TOLUCA', zonaEscolar: '000', sector: '01', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'FJT' },
  { cct: '15FTS0001H', nombre: 'CCT 15FTS0001H', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '000', sector: '01', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'FTS' },
  { cct: '15FTV0001V', nombre: 'CCT 15FTV0001V', municipio: 'NEZAHUALCOYOTL', zonaEscolar: '001', sector: '02', region: 'NEZAHUALCOYOTL', valle: 'MEXICO', modalidad: 'FTV' },
  { cct: '15FZF0001Y', nombre: 'CCT 15FZF0001Y', municipio: 'ATLACOMULCO', zonaEscolar: '001', sector: '00', region: 'ATLACOMULCO', valle: 'TOLUCA', modalidad: 'FZF' },
  { cct: '15FZT0001R', nombre: 'CCT 15FZT0001R', municipio: 'TOLUCA', zonaEscolar: '001', sector: '01', region: 'TOLUCA', valle: 'TOLUCA', modalidad: 'FZT' },
];
