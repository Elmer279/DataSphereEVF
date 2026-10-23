import { google } from 'googleapis';
import * as fs from 'fs';

async function testSa() {
  console.log('Testing GoogleAuth with keyFile...');
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'gstore-keys.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const client = await auth.getClient();
    console.log('Client class:', client.constructor.name);
    
    console.log('Attempting to fetch access token via client...');
    const token = await client.getAccessToken();
    console.log('SUCCESS! Access token retrieved:', token.token ? 'YES' : 'NO');
  } catch (err: any) {
    console.error('GoogleAuth FAILED:', err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

testSa();
