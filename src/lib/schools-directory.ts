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

// Basado en el formato: CCT, SECTOR, ZE, VALLE, MODALIDAD, TURNO, CVE MUNICIPIO, MUNICIPIO, REGION
const rawData: any[][] = [
  ['15ADG0001Q', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0002P', '00', '000', 'M', 'ADG', '400', '033', 'ECATEPEC', 'ECATEPEC'],
  ['15ADG0004N', '00', '000', 'M', 'ADG', '400', '109', 'TULTITLAN', 'TULTITLAN'],
  ['15ADG0005M', '00', '000', 'M', 'ADG', '400', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15ADG0007E', '00', '000', 'M', 'ADG', '400', '033', 'ECATEPEC', 'ECATEPEC'],
  ['15ADG0007K', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0007N', '00', '000', 'M', 'ADG', '400', '057', 'NAUCALPAN DE JUAREZ', 'NAUCALPAN'],
  ['15ADG0007Z', '00', '000', 'M', 'ADG', '400', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15ADG0031K', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0032J', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0033I', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0034H', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0035G', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0036F', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0037E', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0038D', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0039C', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0040S', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0041R', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0042Q', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0043P', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0044O', '', '', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0048K', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0050Z', '00', '000', 'T', 'ADG', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15ADG0061E', '00', '000', 'T', 'ADG', '400', '076', 'SAN MATEO ATENCO', 'LERMA'],
  ['15ADG0076G', '00', '000', 'T', 'ADG', '400', '054', 'METEPEC', 'TOLUCA'],
  ['15ADG0083Q', '00', '000', 'M', 'ADG', '400', '109', 'TULTITLAN', 'TULTITLAN'],
  ['15ADG0085O', '00', '000', 'M', 'ADG', '400', '104', 'TLALNEPANTLA DE BAZ', 'TLALNEPANTLA'],
  ['15ADG0086N', '00', '000', 'M', 'ADG', '400', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15ADG0087M', '00', '000', 'M', 'ADG', '400', '033', 'ECATEPEC', 'ECATEPEC'],
  ['15ADG0112V', '00', '000', 'M', 'ADG', '400', '057', 'NAUCALPAN DE JUAREZ', 'NAUCALPAN'],
  ['15ADG0124Z', '00', '000', 'T', 'ADG', '400', '118', 'ZINACANTEPEC', 'TOLUCA'],
  ['15DES0001R', '08', '030', 'T', 'DES', '120', '014', 'ATLACOMULCO', 'ATLACOMULCO'],
  ['15DES0002Q', '09', '024', 'M', 'DES', '120', '099', 'TEXCOCO', 'TEXCOCO'],
  ['15DES0003P', '02', '006', 'M', 'DES', '120', '104', 'TLALNEPANTLA DE BAZ', 'TLALNEPANTLA'],
  ['15DES0004O', '09', '023', 'M', 'DES', '120', '103', 'TLALMANALCO', 'AMECAMECA'],
  ['15DES0005N', '02', '008', 'M', 'DES', '120', '060', 'NICOLAS ROMERO', 'NAUCALPAN'],
  ['15DES0006M', '07', '028', 'T', 'DES', '120', '110', 'VALLE DE BRAVO', 'VALLE DE BRAVO'],
  ['15DES0007L', '06', '037', 'T', 'DES', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DES0008K', '02', '009', 'M', 'DES', '120', '013', 'ATIZAPAN DE ZARAGOZA', 'TLALNEPANTLA'],
  ['15DES0010Z', '05', '033', 'M', 'DES', '120', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15DES0011Y', '01', '001', 'M', 'DES', '120', '057', 'NAUCALPAN DE JUAREZ', 'NAUCALPAN'],
  ['15DES0012X', '06', '026', 'T', 'DES', '120', '106', 'TOLUCA', 'TOLUCA'],
  ['15DES0013W', '09', '007', 'M', 'DES', '120', '039', 'IXTAPALUCA', 'CHIMALHUACAN'],
  ['15DES0025A', '04', '016', 'M', 'DES', '120', '033', 'ECATEPEC', 'ECATEPEC'],
  ['15DES0036G', '03', '012', 'M', 'DES', '120', '109', 'TULTITLAN', 'TULTITLAN'],
  ['15DES0103O', '04', '032', 'M', 'DES', '120', '081', 'TECAMAC', 'ECATEPEC'],
  ['15DES0228W', '03', '010', 'M', 'DES', '100', '121', 'CUAUTITLAN IZCALLI', 'CUAUTITLAN IZCALLI'],
  ['15DES0235F', '06', '026', 'T', 'DES', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DES0317P', '06', '037', 'T', 'DES', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DST0001J', '02', '002', 'T', 'DST', '120', '101', 'TIANGUISTENCO', 'LERMA'],
  ['15DST0002I', '01', '001', 'T', 'DST', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DST0003H', '04', '012', 'M', 'DST', '120', '104', 'TLALNEPANTLA DE BAZ', 'TLALNEPANTLA'],
  ['15DST0005F', '07', '020', 'M', 'DST', '100', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15DST0008C', '01', '009', 'T', 'DST', '100', '082', 'TEJUPILCO', 'TEJUPILCO'],
  ['15DST0010R', '03', '028', 'T', 'DST', '100', '001', 'ACAMBAY', 'ATLACOMULCO'],
  ['15DST0013O', '04', '010', 'M', 'DST', '120', '057', 'NAUCALPAN DE JUAREZ', 'NAUCALPAN'],
  ['15DST0015M', '05', '018', 'M', 'DST', '120', '020', 'COACALCO DE BERRIOZABAL', 'TULTITLAN'],
  ['15DST0023V', '06', '014', 'M', 'DST', '120', '033', 'ECATEPEC', 'ECATEPEC'],
  ['15DST0025T', '05', '025', 'M', 'DST', '120', '109', 'TULTITLAN', 'TULTITLAN'],
  ['15DST0043I', '06', '029', 'M', 'DST', '100', '081', 'TECAMAC', 'ECATEPEC'],
  ['15DST0057L', '05', '013', 'M', 'DST', '100', '121', 'CUAUTITLAN IZCALLI', 'CUAUTITLAN IZCALLI'],
  ['15DTV0001X', '06', '026', 'M', 'DTV', '100', '120', 'ZUMPANGO', 'ZUMPANGO'],
  ['15DTV0002W', '06', '004', 'M', 'DTV', '100', '011', 'ATENCO', 'TEXCOCO'],
  ['15DTV0004U', '04', '016', 'T', 'DTV', '100', '051', 'LERMA', 'LERMA'],
  ['15DTV0014A', '09', '027', 'T', 'DTV', '100', '118', 'ZINACANTEPEC', 'TOLUCA'],
  ['15DTV0025G', '09', '028', 'T', 'DTV', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DTV0069D', '04', '011', 'T', 'DTV', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15DTV0119V', '04', '030', 'T', 'DTV', '100', '076', 'SAN MATEO ATENCO', 'LERMA'],
  ['15DTV0216X', '04', '011', 'T', 'DTV', '100', '054', 'METEPEC', 'TOLUCA'],
  ['15DTV0274N', '09', '028', 'T', 'DTV', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15FJE0009Q', '06', '000', 'T', 'FJE', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15FJT0001Q', '01', '000', 'T', 'FJT', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15FTS0001H', '01', '000', 'M', 'FTS', '100', '058', 'NEZAHUALCOYOTL', 'NEZAHUALCOYOTL'],
  ['15FTV0011B', '04', '011', 'T', 'FTV', '100', '106', 'TOLUCA', 'TOLUCA'],
  ['15FZF0001Y', '00', '001', 'T', 'FZF', '400', '014', 'ATLACOMULCO', 'ATLACOMULCO'],
  ['15FZT0001R', '01', '001', 'T', 'FZT', '400', '106', 'TOLUCA', 'TOLUCA'],
  ['15FZT0010Z', '04', '010', 'M', 'FZT', '400', '057', 'NAUCALPAN DE JUAREZ', 'NAUCALPAN']
];

export const schoolsDirectory: SchoolInfo[] = rawData.map(row => ({
  cct: row[0] as string,
  nombre: `${row[4]} ${row[0]}`, // Modalidad + CCT como identificador de nombre
  sector: (row[1] as string) || '00',
  zonaEscolar: (row[2] as string) || '000',
  valle: row[3] === 'T' ? 'TOLUCA' : row[3] === 'M' ? 'MEXICO' : (row[3] as string || ''),
  modalidad: (row[4] as string) || '',
  municipio: (row[7] as string) || '',
  region: (row[8] as string) || ''
}));
