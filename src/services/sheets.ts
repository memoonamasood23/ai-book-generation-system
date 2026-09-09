import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export interface SheetBookRequest {
  rowId: number;
  title: string;
  notesBefore: string;
  status: string;
  rowRef: any; // Reference to the original GoogleSpreadsheetRow object
}

export class GoogleSheetsService {
  private doc: GoogleSpreadsheet | null = null;
  private isConfigured = false;

  constructor() {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!sheetId || !clientEmail || !privateKey) {
      console.warn('⚠️  Google Sheets credentials not found in env. Using local mock sheet data.');
      this.isConfigured = false;
    } else {
      try {
        const serviceAccountAuth = new JWT({
          email: clientEmail,
          // Replace escaped newlines from the environment variable string
          key: privateKey.replace(/\\n/g, '\n'),
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
        this.isConfigured = true;
      } catch (error) {
        console.error('❌ Failed to initialize Google Sheets client:', (error as Error).message);
        this.isConfigured = false;
      }
    }
  }

  /**
   * Fetches pending book requests from the Google Sheet (or returns mock data if unconfigured).
   * Looks for rows with an empty 'Status' column or status equal to 'pending'.
   */
  async fetchBookRequests(): Promise<SheetBookRequest[]> {
    if (!this.isConfigured || !this.doc) {
      console.log('📋 Local Sheet: Fetching mock pending book requests...');
      return [
        {
          rowId: 1,
          title: 'The AI-Driven Enterprise',
          notesBefore: 'Focus on how small and medium businesses can deploy AI agents to automate daily operations, CRM, and customer support.',
          status: 'pending',
          rowRef: null,
        }
      ];
    }

    try {
      await this.doc.loadInfo();
      const sheet = this.doc.sheetsByIndex[0]; // Use the first tab
      const rows = await sheet.getRows();
      const requests: SheetBookRequest[] = [];

      rows.forEach((row, index) => {
        const title = row.get('Title') || '';
        const notesBefore = row.get('Notes Before') || '';
        const status = (row.get('Status') || '').toLowerCase().trim();

        // Include row if Title exists and status is empty or 'pending'
        if (title && (status === 'pending' || !status)) {
          requests.push({
            rowId: index + 1, // 1-indexed for sheets UI representation
            title,
            notesBefore,
            status: status || 'pending',
            rowRef: row,
          });
        }
      });

      console.log(`📋 Google Sheets: Found ${requests.length} pending request(s).`);
      return requests;
    } catch (error) {
      console.error('❌ Google Sheets: Failed to fetch requests. Using mock fallback.', (error as Error).message);
      return [
        {
          rowId: 1,
          title: 'The AI-Driven Enterprise',
          notesBefore: 'Focus on how small and medium businesses can deploy AI agents to automate daily operations, CRM, and customer support.',
          status: 'pending',
          rowRef: null,
        }
      ];
    }
  }

  /**
   * Updates the status and output link of a book generation request row.
   */
  async updateRequestStatus(
    request: SheetBookRequest,
    status: string,
    outputLink?: string
  ): Promise<void> {
    if (!this.isConfigured || !request.rowRef) {
      console.log(`📋 Local Sheet: Updated Row #${request.rowId} status to "${status}" ${outputLink ? `with output link: ${outputLink}` : ''}`);
      return;
    }

    try {
      request.rowRef.set('Status', status);
      if (outputLink) {
        request.rowRef.set('Output Link', outputLink);
      }
      await request.rowRef.save();
      console.log(`✅ Google Sheets: Successfully updated Row #${request.rowId} status to "${status}".`);
    } catch (error) {
      console.error(`❌ Google Sheets: Failed to update Row #${request.rowId}`, (error as Error).message);
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
