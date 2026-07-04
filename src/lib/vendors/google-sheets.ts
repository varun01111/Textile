import { google } from "googleapis";

import { getGoogleSheetsEnv } from "@/lib/env";
import { getSheetHeaders } from "@/lib/transforms/google-sheet-row";

let sheetsClient: ReturnType<typeof google.sheets> | null = null;
let authClient: InstanceType<typeof google.auth.JWT> | null = null;

function getClient() {
  if (sheetsClient && authClient) {
    return { sheets: sheetsClient, auth: authClient };
  }

  const env = getGoogleSheetsEnv();
  authClient = new google.auth.JWT({
    email: env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: env.GOOGLE_SHEETS_PRIVATE_KEY,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  sheetsClient = google.sheets({ version: "v4", auth: authClient });

  return { sheets: sheetsClient, auth: authClient };
}

function parseUpdatedRowNumber(updatedRange?: string | null) {
  if (!updatedRange) {
    return null;
  }

  const match = updatedRange.match(/![A-Z]+(\d+):/);
  return match ? Number(match[1]) : null;
}

export async function appendConversationRow(values: string[]) {
  const env = getGoogleSheetsEnv();
  const { sheets } = getClient();

  await sheets.spreadsheets.values.update({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${env.GOOGLE_SHEET_NAME}!A1:T1`,
    valueInputOption: "RAW",
    requestBody: {
      values: [getSheetHeaders()],
    },
  });

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    range: `${env.GOOGLE_SHEET_NAME}!A:T`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [values],
    },
  });

  return {
    rowNumber: parseUpdatedRowNumber(
      response.data.updates?.updatedRange ?? response.data.tableRange ?? null,
    ),
    spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
    sheetName: env.GOOGLE_SHEET_NAME,
  };
}
