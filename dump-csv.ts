import fetch from 'node-fetch';

const SPREADSHEET_ID = '1X2yzbCNfoXjfS7bMYFIPJsCXNW_IPXzkr_spPjNvhVo';
const TAB_NAME = 'MELODY ANNE B. AQUINO';

async function dump() {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB_NAME)}`;
  try {
    const res = await fetch(csvUrl);
    const text = await res.text();
    console.log('--- FULL CSV DUMP ---');
    console.log(text);
    console.log('--- END OF CSV DUMP ---');
  } catch (err: any) {
    console.error(err);
  }
}

dump();
