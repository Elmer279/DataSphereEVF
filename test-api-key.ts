import fetch from 'node-fetch';

const API_KEY = 'AIzaSyBwMPeVi6Sq16gaCV0HGU_WZySkxUZZvCw';
const SPREADSHEET_ID = '1X2yzbCNfoXjfS7bMYFIPJsCXNW_IPXzkr_spPjNvhVo';

const referersToTry = [
  'https://ais-dev-f7qosxaawcqea5w6kpqjfv-432158901074.asia-southeast1.run.app/',
  'https://ais-dev-f7qosxaawcqea5w6kpqjfv-432158901074.asia-southeast1.run.app',
  'https://ais-pre-f7qosxaawcqea5w6kpqjfv-432158901074.asia-southeast1.run.app/',
  'https://ais-pre-f7qosxaawcqea5w6kpqjfv-432158901074.asia-southeast1.run.app',
  'https://ai.studio/build',
  'https://ai.studio/build/',
  'http://localhost:3000/',
  'http://localhost:3000',
  'https://localhost:3000',
  'https://tcsdals.com/',
  'https://tcsdals.com'
];

async function testApiKey() {
  console.log('Testing provided Google Sheets API Key with different referer headers...');
  
  for (const ref of referersToTry) {
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?key=${API_KEY}`;
    try {
      const res = await fetch(metaUrl, {
        headers: {
          'Referer': ref
        }
      });
      const data: any = await res.json();
      if (res.ok) {
        console.log(`\nSUCCESS with Referer: "${ref}"!`);
        console.log('Title:', data.properties?.title);
        console.log('Sheets/Tabs:');
        data.sheets?.forEach((s: any) => {
          console.log(`- "${s.properties?.title}" (ID: ${s.properties?.sheetId})`);
        });
        return;
      } else {
        console.log(`Failed for "${ref}":`, data.error?.message);
      }
    } catch (err: any) {
      console.error(`Fetch error for "${ref}":`, err.message || err);
    }
  }
  console.log('\nAll referers tried, none succeeded.');
}

testApiKey();
