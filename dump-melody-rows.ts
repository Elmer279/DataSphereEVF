import fetch from 'node-fetch';

const SPREADSHEET_ID = '1X2yzbCNfoXjfS7bMYFIPJsCXNW_IPXzkr_spPjNvhVo';
const GID = '1400094535'; // MELODY ANNE B. AQUINO

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
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${GID}`;
  try {
    const res = await fetch(url);
    const text = await res.text();
    const rows = parseCSV(text);
    console.log('Total rows parsed:', rows.length);
    for (let i = 0; i < Math.min(25, rows.length); i++) {
      console.log(`\nRow ${i}:`);
      rows[i].forEach((cell, colIdx) => {
        if (cell.trim()) {
          console.log(`  Col ${colIdx}: "${cell.replace(/\n/g, '\\n')}"`);
        }
      });
    }
  } catch (err: any) {
    console.error(err);
  }
}

test();
