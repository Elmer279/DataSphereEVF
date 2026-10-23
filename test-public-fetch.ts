import fetch from 'node-fetch';

const SPREADSHEET_ID = '1X2yzbCNfoXjfS7bMYFIPJsCXNW_IPXzkr_spPjNvhVo';
// Try one of the tab names, e.g., MELODY ANNE B. AQUINO or first tab
const TAB_NAME = 'MELODY ANNE B. AQUINO';

async function testPublicFetch() {
  console.log(`Testing public CSV fetch for sheet "${SPREADSHEET_ID}" and tab "${TAB_NAME}"...`);
  
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB_NAME)}`;
  const exportUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&sheet=${encodeURIComponent(TAB_NAME)}`;

  try {
    console.log('Trying gviz CSV endpoint...');
    const res1 = await fetch(csvUrl);
    console.log('gviz response status:', res1.status);
    const text1 = await res1.text();
    console.log('gviz response length:', text1.length);
    if (res1.ok && text1.length > 100 && !text1.includes('<!DOCTYPE html>')) {
      console.log('SUCCESS! gviz CSV fetched. First 200 chars:');
      console.log(text1.substring(0, 200));
      return;
    } else {
      console.log('gviz CSV failed or returned HTML login page.');
    }

    console.log('Trying export CSV endpoint...');
    const res2 = await fetch(exportUrl);
    console.log('export response status:', res2.status);
    const text2 = await res2.text();
    console.log('export response length:', text2.length);
    if (res2.ok && text2.length > 100 && !text2.includes('<!DOCTYPE html>')) {
      console.log('SUCCESS! export CSV fetched. First 200 chars:');
      console.log(text2.substring(0, 200));
      return;
    } else {
      console.log('export CSV failed or returned HTML login page.');
    }
  } catch (err: any) {
    console.error('Fetch error:', err.message || err);
  }
}

testPublicFetch();
