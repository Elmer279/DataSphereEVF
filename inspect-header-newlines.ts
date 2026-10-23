import fetch from 'node-fetch';

const SPREADSHEET_ID = '1X2yzbCNfoXjfS7bMYFIPJsCXNW_IPXzkr_spPjNvhVo';
const TAB_NAME = 'MELODY ANNE B. AQUINO';

function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let cell = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(cell);
        lines.push(row);
        row = [];
        cell = '';
      } else {
        cell += char;
      }
    }
  }
  
  if (cell || row.length > 0) {
    row.push(cell);
    lines.push(row);
  }
  
  return lines;
}

async function test() {
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(TAB_NAME)}`;
  try {
    const res = await fetch(csvUrl);
    const text = await res.text();
    const rows = parseCSV(text);
    const firstRow = rows[0];
    
    console.log('Number of columns in first row:', firstRow.length);
    firstRow.forEach((col, idx) => {
      console.log(`\n--- COLUMN ${idx} ---`);
      console.log('Length:', col.length);
      const lines = col.split('\n');
      console.log('Lines count:', lines.length);
      lines.forEach((line, lIdx) => {
        console.log(`  Line ${lIdx}: "${line}"`);
      });
    });
  } catch (err: any) {
    console.error(err);
  }
}

test();
