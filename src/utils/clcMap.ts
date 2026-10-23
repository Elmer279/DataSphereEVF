/**
 * Lookup mapping and utility functions for Community Learning Centers and their corresponding codes.
 */

export const CLC_TO_CODE_MAP: Record<string, string> = {
  "Aguso": "1420984178",
  "Alvindia": "1177426590",
  "Amucao": "1128262418",
  "Armenia": "140528583",
  "Asturias": "1620350667",
  "Atioc": "1591476287",
  "Balanti": "1994498169",
  "Balete": "390652637",
  "Balibago I": "950417836",
  "Balibago II": "1568112947",
  "Balingcanaway": "37686490",
  "Banaba": "894841331",
  "Bantog": "1730282470",
  "Baras-Baras": "1276684070",
  "Batang-Batang": "1222633096",
  "Binauganan": "1311238089",
  "Bora": "1819181282",
  "Buenavista": "1449529608",
  "Buhilit": "899247425",
  "Burot": "1093408926",
  "Calingcuan": "1517430457",
  "Capehan": "1762482242",
  "Carangian": "153841883",
  "Care": "197909116",
  "Central": "1513518253",
  "Culipat": "1614630804",
  "Cut Cut I": "183734870",
  "Cut Cut II": "561791877",
  "Dalayap": "169358221",
  "Dela Paz": "1008581392",
  "Dolores": "1107281292",
  "Laoang": "1559799693",
  "Ligtasan": "1967098992",
  "Lourdes": "1448349702",
  "Mabini": "2099060218",
  "Maligaya": "1643024082",
  "Maliwalo": "205442069",
  "Mapalacsiao": "108346015",
  "Mapalad": "648348564",
  "Matatalaib": "1171094375",
  "Paraiso": "304729035",
  "Poblacion": "616175080",
  "Salapungan": "2005542006",
  "San Carlos": "1070873009",
  "San Francisco": "1574228210",
  "San Isidro": "626497509",
  "San Jose": "230887233",
  "San Jose De Urquico": "211306950",
  "San Juan Bautista": "1580779889",
  "San Juan De Bautista": "1580779889",
  "San Juan De Mata": "1557061591",
  "San Luis": "407316572",
  "San Miguel": "1602550268",
  "San Manuel": "319138086",
  "San Nicolas": "147216439",
  "San Pablo": "991380775",
  "San Pascual": "643556810",
  "San Rafael": "174468144",
  "San Roque": "143322848",
  "San Sebastian": "2027681779",
  "San Vicente": "1574585180",
  "Santa Cruz": "1268697426",
  "Santa Maria": "1217355021",
  "Sto. Cristo": "896016426",
  "Sto. Domingo": "2028717688",
  "Sto. Nino": "157317607",
  "Sapang Tagalog": "915969212",
  "Sapang Maragul": "1149506706",
  "Sepung Calzada": "1568552552",
  "Sinait": "1879142578",
  "Suizo": "1148124938",
  "Tariji": "1244741725",
  "Tibagan": "221027565",
  "Tibag": "1955731841",
  "Trinidad": "1072886762",
  "Ungot": "916343598",
  "Villa Bacolor": "706883358",
  "Baras Baras BJMP Male Dorm": "484086484",
  "Baras Baras BJMP Female Dorm": "1120058691"
};

export const COMMUNITY_LEARNING_CENTERS = Object.keys(CLC_TO_CODE_MAP);

/**
 * Retrieves the code for a given CLC name.
 * If not found, returns empty string.
 */
export function getClcCode(clcName: string): string {
  if (!clcName) return "";
  const normalized = clcName.trim().toUpperCase();
  for (const [key, val] of Object.entries(CLC_TO_CODE_MAP)) {
    if (key.toUpperCase() === normalized) {
      return val;
    }
  }
  return "";
}
