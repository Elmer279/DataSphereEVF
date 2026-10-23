/**
 * Google Apps Script for "TCSD ALS CLASS PROGRAM - SCHOOL YEAR 2026 - 2027"
 * 
 * This script automates formatting, alignment, and cleanup of the Class Program schedule sheets.
 * It applies structural formatting and removes outdated text elements while preserving sheet formulas,
 * protections, and existing schedule data.
 * 
 * Instructions:
 * 1. Open your Google Spreadsheet: "TCSD ALS CLASS PROGRAM - SCHOOL YEAR 2026 - 2027"
 * 2. Click "Extensions" from the top menu, then select "Apps Script".
 * 3. You can either append this code to your existing script or paste it in a new script file.
 * 4. Save (Ctrl + S) the script.
 * 5. Run the `updateClassProgramSpreadsheet` function directly from the editor, or use the newly added 
 *    "TCSD ALS Tools" menu in the spreadsheet toolbar after reloading.
 */

// Custom menu item to trigger updates easily from the Spreadsheet interface
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("TCSD ALS Tools")
    .addItem("Update Class Program Sheets", "updateClassProgramSpreadsheet")
    .addToUi();
}

/**
 * Main orchestration function. Filters out protected/excluded sheets and 
 * runs structural updates, alignment, and formatting on the target sheets.
 */
function updateClassProgramSpreadsheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  
  const excludedSheets = [
    "CLC Information",
    "JOEL D. BAQUING",
    "JOHN L. ABAD",
    "MA. MONIQUE A. FRANCISCO",
    "JANICE J. GAMIS",
    "CINDY M. VALETE"
  ];
  
  let processedCount = 0;
  let skippedCount = 0;
  
  for (let sheet of sheets) {
    const sheetName = sheet.getName().trim();
    
    // Check if sheet should be skipped
    const isExcluded = excludedSheets.some(
      excluded => excluded.toLowerCase() === sheetName.toLowerCase()
    );
    
    if (isExcluded) {
      Logger.log(`Skipping excluded sheet: "${sheetName}"`);
      skippedCount++;
      continue;
    }
    
    Logger.log(`Processing sheet: "${sheetName}"`);
    
    try {
      // 1. Update Header Text (with Bookman Old Style & Alignment preservation)
      updateHeaderText(sheet);
      
      // 2. Remove Unwanted Text Elements (Clear Schedules, + Click to schedule, etc.)
      removeUnwantedElements(sheet);
      
      // 3. Align "TIME" and "MINUTES" Columns
      alignTimeAndMinutesColumns(sheet);
      
      processedCount++;
    } catch (err) {
      Logger.log(`Error processing sheet "${sheetName}": ${err.message}`);
    }
  }
  
  const summaryMsg = `Update completed! Processed: ${processedCount} sheets, Skipped: ${skippedCount} sheets.`;
  Logger.log(summaryMsg);
  
  // Display a modern alert notification to the user
  try {
    SpreadsheetApp.getUi().alert("TCSD ALS Class Program Formatter", summaryMsg, SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (e) {
    // Falls back gracefully if run outside Spreadsheet UI context
  }
}

/**
 * Requirement 2: Locates and replaces the header text, applying "Bookman Old Style" font
 * while preserving existing alignment. Handles both single-cell multi-line and multi-cell structures.
 */
function updateHeaderText(sheet) {
  // Check the top 15 rows and first 10 columns for the header
  const range = sheet.getRange(1, 1, 15, 10);
  const values = range.getValues();
  const numRows = values.length;
  const numCols = values[0].length;
  
  const searchStr = "Republic of the Philippines";
  const newHeaderLines = [
    "Republic of the Philippines",
    "Department of Education",
    "Region III - Central Luzon",
    "TARLAC CITY SCHOOLS DIVISION",
    "TCSD ALS CLASS PROGRAM",
    "School Year 2026 - 2027"
  ];
  const newHeaderSingleCell = newHeaderLines.join("\n");
  
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const val = String(values[r][c]).trim();
      if (val.indexOf(searchStr) !== -1) {
        const cell = sheet.getRange(r + 1, c + 1);
        
        if (val.indexOf("\n") !== -1) {
          // Case A: The header is contained within a single cell with newline separators
          cell.setValue(newHeaderSingleCell);
          cell.setFontFamily("Bookman Old Style");
          Logger.log(`  - Updated single-cell header in row ${r + 1}, col ${c + 1}`);
          return;
        } else {
          // Case B: The header is spread across sequential rows in the same column
          for (let i = 0; i < newHeaderLines.length; i++) {
            const lineCell = sheet.getRange(r + 1 + i, c + 1);
            lineCell.setValue(newHeaderLines[i]);
            lineCell.setFontFamily("Bookman Old Style");
          }
          
          // Clear any leftover Mobile Teacher row if it fell within the original block we replaced
          const possibleTeacherCell = sheet.getRange(r + 7, c + 1);
          const val7 = String(possibleTeacherCell.getValue()).trim();
          if (val7.toLowerCase().includes("mobile teacher")) {
            possibleTeacherCell.clearContent();
          }
          
          Logger.log(`  - Updated multi-row header starting at row ${r + 1}, col ${c + 1}`);
          return;
        }
      }
    }
  }
  
  Logger.log("  - Header text with 'Republic of the Philippines' not found. Applying fallback to cell A1.");
  // Fallback if not found: Write to A1 as single cell
  const fallbackCell = sheet.getRange(1, 1);
  fallbackCell.setValue(newHeaderSingleCell);
  fallbackCell.setFontFamily("Bookman Old Style");
}

/**
 * Requirement 3: Scans the sheet and completely clears specific unwanted text elements, 
 * removing any associated validations and notes without disturbing the surrounding layout.
 */
function removeUnwantedElements(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  const numRows = values.length;
  const numCols = values[0] ? values[0].length : 0;
  
  const textsToRemove = [
    "Clear Schedules",
    "ALS Schedule Matrices",
    "DepEd Form 2 Baseline",
    "Custom editable timetable grid reflecting statutory learning strands, teaching methodologies, local CLCs placement, and afternoon community mapping sessions",
    "Assigned ALS attendance",
    "+ Click to schedule"
  ];
  
  let clearedCount = 0;
  
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const cellValue = String(values[r][c]).trim();
      if (!cellValue) continue;
      
      for (let unwantedText of textsToRemove) {
        if (cellValue.toLowerCase().includes(unwantedText.toLowerCase())) {
          const cell = sheet.getRange(r + 1, c + 1);
          cell.clearContent();
          cell.setDataValidation(null);
          cell.clearNote();
          clearedCount++;
        }
      }
    }
  }
  
  if (clearedCount > 0) {
    Logger.log(`  - Cleared ${clearedCount} occurrences of unwanted text elements.`);
  }
}

/**
 * Requirement 4: Locates columns labeled "TIME" and "MINUTES" (headers and data)
 * and sets vertical alignment to Middle, horizontal alignment to Center.
 */
function alignTimeAndMinutesColumns(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  const numRows = values.length;
  const numCols = values[0] ? values[0].length : 0;
  
  for (let c = 0; c < numCols; c++) {
    for (let r = 0; r < Math.min(15, numRows); r++) {
      const val = String(values[r][c]).trim().toLowerCase();
      if (val === "time" || val === "minutes") {
        // Apply vertical alignment to Middle and horizontal alignment to Center for the entire column
        const colRange = sheet.getRange(r + 1, c + 1, numRows - r, 1);
        colRange.setVerticalAlignment("middle");
        colRange.setHorizontalAlignment("center");
        Logger.log(`  - Aligned column "${val.toUpperCase()}" at index ${c + 1} to Center & Middle.`);
        break; // Scan next column
      }
    }
  }
}


