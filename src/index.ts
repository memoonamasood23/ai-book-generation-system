import 'dotenv/config';
import { dbService } from './services/database';
import { notificationService } from './services/notifications';
import { googleSheetsService } from './services/sheets';
import { generateOutlineStage } from './workflows/stage1-outline';
import { generateChaptersStage } from './workflows/stage2-chapters';
import { compileBookStage } from './workflows/stage3-compilation';

async function main() {
  console.log('\n🚀 Starting Automated Book Generation System\n');

  try {
    // Step 1: Fetch pending requests from Google Sheets
    const requests = await googleSheetsService.fetchBookRequests();

    if (requests.length === 0) {
      console.log('🏁 No pending book requests found in the spreadsheet.');
      process.exit(0);
    }

    for (const req of requests) {
      console.log(`\n${'=' .repeat(60)}`);
      console.log(`📥 PROCESSING SHEET REQUEST: "${req.title}" (Row #${req.rowId})`);
      console.log(`${'=' .repeat(60)}\n`);

      try {
        // Step 2: Mark request as processing in Sheets
        await googleSheetsService.updateRequestStatus(req, 'processing');

        // Step 3: Create book record in Database
        console.log(`📖 Creating book record: "${req.title}"`);
        const bookId = await dbService.createBook(req.title);
        console.log(`✅ Book ID: ${bookId}\n`);

        // Step 4: Stage 1 - Generate Outline
        const outline = await generateOutlineStage(
          bookId,
          req.title,
          req.notesBefore
        );

        // Step 5: Simulate approval for demo
        console.log(`\n⏭️  Auto-approving outline for demo...`);
        await dbService.setApprovalStatus(bookId, 'outline', 'no_notes_needed');
        await dbService.updateBookStatus(bookId, 'chapter_generation');

        // Step 6: Stage 2 - Generate Chapters
        const chapters = await generateChaptersStage(bookId, req.title, outline);

        // Step 7: Auto-approve all chapters for demo
        for (let i = 1; i <= chapters.length; i++) {
          await dbService.setApprovalStatus(bookId, `chapter_${i}`, 'no_notes_needed');
        }

        // Step 8: Stage 3 - Compile Book
        const outputPath = await compileBookStage(bookId, req.title, outline, chapters);

        // Step 9: Mark request as completed with output file link
        await googleSheetsService.updateRequestStatus(req, 'completed', outputPath);

        // Success message for this specific book
        console.log(`\n${'=' .repeat(60)}`);
        console.log(`✅ BOOK WORKFLOW COMPLETE: "${req.title}"`);
        console.log(`${'=' .repeat(60)}`);
        console.log(`📚 Total Chapters: ${chapters.length}`);
        console.log(`📁 Output File: ${outputPath}`);
        console.log(`📊 Database: ${process.env.SUPABASE_URL ? 'Supabase' : 'Local Demo'}`);
        console.log(`${'=' .repeat(60)}\n`);

      } catch (error) {
        console.error(`\n❌ ERROR processing "${req.title}": ${(error as Error).message}`);
        await googleSheetsService.updateRequestStatus(req, 'failed');
        await notificationService.notifyError(error);
        // Continue to the next book request in the sheet, don't crash the whole run!
      }
    }

    console.log('🎉 All pending book requests have been processed successfully!');
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ CRITICAL SYSTEM ERROR: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run
main();
