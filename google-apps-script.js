/**
 * Google Apps Script for "Tarlac City ALS Baseline Data on Literacy Mapping"
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet: "Tarlac City ALS Baseline Data on Literacy Mapping"
 * 2. Click "Extensions" from the top menu, then select "Apps Script".
 * 3. Delete any default filler code inside the editor.
 * 4. Paste this entire code block into the Apps Script editor.
 * 5. Change "YOUR_SECRET_TOKEN" below to any string of your choice for custom API client validation.
 * 6. Save (Ctrl+S) and click "Deploy" > "New Deployment".
 * 7. Choose "Web App", set "Execute as: Me (your email)", and "Who has access: Anyone".
 * 8. Click "Deploy" and Authorize permissions.
 * 9. Copy the generated "Web App URL" and paste it into the TCSD ALS DataSphere Admin Hub!
 */

const SECRET_API_TOKEN = "TCSD_ALS_SECRET_KEY";
const MY_SECRET_KEY = "evf-datasphere-secret-key-11021973"; // You define this here

/**
 * Handle HTTP GET Requests.
 * Exposes all barangay mapping records as a consolidated JSON feed or queries an individual tab.
 */
function doGet(e) {
  try {
    const params = e.parameter || {};
    const requestedTab = params.tab; // optional tab name (e.g., "Aguso", "Alvindia")
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets();
    const allRecords = [];
    
    for (let s of sheets) {
      const sheetName = s.getName();
      // Skip generic baseline statistics tabs or index sheets if applicable
      if (sheetName.toLowerCase().startsWith("sheet") || sheetName.toLowerCase().includes("dashboard")) {
        continue;
      }
      
      // If a specific tab is requested, skip others
      if (requestedTab && sheetName.toLowerCase() !== requestedTab.toLowerCase()) {
        continue;
      }
      
      const sheetData = s.getDataRange().getValues();
      if (sheetData.length < 2) continue; // Skip empty rows or sheets with headers only
      
      const headers = sheetData[0].map(h => String(h).trim().toLowerCase());
      
      // Map columns dynamically based on requested ALS literacy mapping headers
      const fields = {
        recordNumber: findIndex(headers, ["record number", "record", "no.", "number"], 0),
        lastName: findIndex(headers, ["last name", "lastname", "family name"], 1),
        firstName: findIndex(headers, ["first name", "firstname", "given name"], 2),
        middleName: findIndex(headers, ["middle name", "middlename"], 3),
        gender: findIndex(headers, ["gender", "sex"], 4),
        dateOfBirth: findIndex(headers, ["date of birth", "dob", "birthdate"], 5),
        age: findIndex(headers, ["age", "yrs"], 6),
        motherTongue: findIndex(headers, ["mother tongue", "dialect"], 7),
        indigenousPeople: findIndex(headers, ["indigenous", "ip", "indigenous people"], 8),
        religion: findIndex(headers, ["religion", "sect"], 9),
        houseNo: findIndex(headers, ["house no", "house number", "house"], 10),
        street: findIndex(headers, ["street", "purok", "sitio"], 11),
        barangay: findIndex(headers, ["barangay", "brgy"], 12),
        fatherName: findIndex(headers, ["father", "father name", "name of father"], 13),
        motherName: findIndex(headers, ["mother", "mother name", "name of mother"], 14),
        contactNumber: findIndex(headers, ["contact number", "contact", "phone", "mobile"], 15),
        lastGradeLevelCompleted: findIndex(headers, ["grade level", "last grade", "schooling completed"], 16),
        dateMapped: findIndex(headers, ["date mapped", "mapped date", "mapped"], 17),
        interestedInALS: findIndex(headers, ["interested", "interest", "interested in als"], 18),
        preferredProgram: findIndex(headers, ["preferred program", "program choice", "program if yes"], 19),
        dateOfFirstAttendance: findIndex(headers, ["attendance", "first attendance", "first day"], 20),
        reasonsForNotAttending: findIndex(headers, ["reasons", "reason for not", "dropout reason", "reasons for not attending"], 21)
      };
      
      for (let i = 1; i < sheetData.length; i++) {
        const row = sheetData[i];
        if (!row[fields.firstName] && !row[fields.lastName]) continue; // Skip empty rows
        
        const getVal = (idx) => row[idx] !== undefined ? String(row[idx]).trim() : "";
        
        allRecords.push({
          barangayTab: sheetName,
          recordNumber: getVal(fields.recordNumber) || String(i),
          lastName: getVal(fields.lastName),
          firstName: getVal(fields.firstName),
          middleName: getVal(fields.middleName),
          gender: getVal(fields.gender),
          dateOfBirth: getVal(fields.dateOfBirth),
          age: parseInt(getVal(fields.age)) || 18,
          motherTongue: getVal(fields.motherTongue),
          indigenousPeople: getVal(fields.indigenousPeople),
          religion: getVal(fields.religion),
          houseNo: getVal(fields.houseNo),
          street: getVal(fields.street),
          barangay: getVal(fields.barangay) || sheetName,
          fatherName: getVal(fields.fatherName),
          motherName: getVal(fields.motherName),
          contactNumber: getVal(fields.contactNumber),
          lastGradeLevelCompleted: getVal(fields.lastGradeLevelCompleted),
          dateMapped: getVal(fields.dateMapped),
          interestedInALS: getVal(fields.interestedInALS),
          preferredProgram: getVal(fields.preferredProgram),
          dateOfFirstAttendance: getVal(fields.dateOfFirstAttendance),
          reasonsForNotAttending: getVal(fields.reasonsForNotAttending)
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      recordsCount: allRecords.length,
      records: allRecords 
    }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: error.message || String(error) 
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle HTTP POST Requests.
 * Allows remote web tools to write / append brand new learner records into their respective barangay sheet tabs.
 */
function doPost(e) {
  // Try to extract X-API-KEY from headers, parameters or post body
  var headers = e.headers || {};
  var providedKey = headers['X-API-KEY'] || headers['x-api-key'] || (e.parameter ? e.parameter['X-API-KEY'] : null);
  
  // Fallback to postData if headers are not parsed
  if (!providedKey && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      providedKey = body['X-API-KEY'] || body['x-api-key'] || body.token;
    } catch(err) {}
  }

  if (providedKey !== MY_SECRET_KEY && providedKey !== SECRET_API_TOKEN) {
    return ContentService.createTextOutput("Unauthorized").setMimeType(ContentService.MimeType.TEXT);
  }

  try {
    const postData = JSON.parse(e.postData.contents);
    
    const action = postData.action || "append_learner";
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // Check for generic or advocacy sheet write operations
    if (action === "append_generic" || action === "append_advocacy" || (postData.tabName && postData.tabName === "Advocacy Materials")) {
      const tabName = postData.tabName || "Advocacy Materials";
      let sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(tabName);
        if (tabName === "Advocacy Materials") {
          sheet.appendRow(["No.", "Title", "Advocacy Type", "Link", "Date Developed", "Developed by"]);
        }
      }
      const rowData = postData.rowData;
      if (!rowData || !Array.isArray(rowData)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Validation failed: rowData array is required." }))
        .setMimeType(ContentService.MimeType.JSON);
      }
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Successfully appended row to sheet: ${tabName}` }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "write_rows_block") {
      const tabName = postData.tabName;
      const rows = postData.rows;
      if (!tabName || !rows || !Array.isArray(rows)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Validation failed: tabName and rows array are required for write_rows_block." }))
        .setMimeType(ContentService.MimeType.JSON);
      }
      let sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(tabName);
      }
      
      const numRows = rows.length;
      const numCols = rows[0] ? rows[0].length : 0;
      
      if (numRows > 0 && numCols > 0) {
        // Clear any old values first, keeping cell formatting, validation, borders intact
        sheet.clearContents();
        
        // Write the block of values starting at cell A1 (1,1)
        const range = sheet.getRange(1, 1, numRows, numCols);
        range.setValues(rows);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Successfully saved ${numRows} rows in sheet: ${tabName}` }))
      .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update_generic") {
      const tabName = postData.tabName || "Advocacy Materials";
      const rangeStr = postData.range; // e.g. "Advocacy Materials!A15:F15" or "A15:F15"
      const rowData = postData.rowData;
      if (!rangeStr || !rowData || !Array.isArray(rowData)) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Validation failed: range and rowData are required for update_generic." }))
        .setMimeType(ContentService.MimeType.JSON);
      }
      
      let sheet = spreadsheet.getSheetByName(tabName);
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: `Sheet tab not found: ${tabName}` }))
        .setMimeType(ContentService.MimeType.JSON);
      }

      // Extract row number from range (e.g. "A15:F15" or "Advocacy Materials!A15:F15" -> 15)
      let rowIndex = -1;
      const match = rangeStr.match(/(\d+)/);
      if (match) {
        rowIndex = parseInt(match[1], 10);
      }

      if (rowIndex > 0) {
        // Set the row values starting at column 1 (A) up to rowData.length
        const range = sheet.getRange(rowIndex, 1, 1, rowData.length);
        range.setValues([rowData]);
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Successfully updated row ${rowIndex} on sheet: ${tabName}` }))
        .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: `Could not determine row index from range: ${rangeStr}` }))
        .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // Default legacy learner recording logic
    const record = postData.record;
    if (!record || !record.barangay || !record.firstName || !record.lastName) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Validation failed: Barangay, FirstName, and LastName are required payload parameters." }))
      .setMimeType(ContentService.MimeType.JSON);
    }
    let sheetName = record.barangay;
    let sheet = spreadsheet.getSheetByName(sheetName);
    
    // Autocreate sheet if tab for barangay does not exist
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      // Setup the header row beautifully
      sheet.appendRow([
        "Record Number", "Last Name", "First Name", "Middle Name", "Gender", 
        "Date of Birth", "Age", "Mother Tongue", "Indigenous People (Yes/No)", 
        "Religion", "House No.", "Street", "Barangay", 
        "Name of Father (Last Name, First Name, Middle Name)", 
        "Name of Mother (Last Name, First Name, Middle Name)", "Contact Number", 
        "Last Grade Level Completed in Formal School", "Date Mapped", 
        "Interested in ALS Program (Yes/No)", "If Yes, Preferred Program", 
        "If already enrolled in ALS, provide date of first attendance", 
        "Reasons for Not Attending, Stopping, or Dropping Out of Formal Schooling"
      ]);
    }
    
    const count = sheet.getLastRow();
    const nextRecordNum = count > 0 ? count : 1;
    
    sheet.appendRow([
      String(nextRecordNum),
      record.lastName || "",
      record.firstName || "",
      record.middleName || "",
      record.gender || "Male",
      record.dateOfBirth || "",
      record.age || "18",
      record.motherTongue || "",
      record.indigenousPeople || "No",
      record.religion || "",
      record.houseNo || "",
      record.street || "",
      record.barangay || "",
      record.fatherName || "",
      record.motherName || "",
      record.contactNumber || "",
      record.lastGradeLevelCompleted || "",
      record.dateMapped || "",
      record.interestedInALS || "No",
      record.preferredProgram || "",
      record.dateOfFirstAttendance || "",
      record.reasonsForNotAttending || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: `Successfully appended record #${nextRecordNum} to sheet: ${sheetName}` }))
    .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.message || String(error) }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

function findIndex(headers, keywords, defaultIdx) {
  const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
  return idx !== -1 ? idx : defaultIdx;
}
