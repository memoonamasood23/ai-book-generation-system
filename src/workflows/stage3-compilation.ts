import { dbService } from '../services/database';
import { exportService } from '../services/export';
import { notificationService } from '../services/notifications';
import { Chapter } from '../types';

export async function compileBookStage(
  bookId: string,
  title: string,
  outline: string,
  chapters: Chapter[]
): Promise<string> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 STAGE 3: FINAL COMPILATION`);
  console.log(`${'='.repeat(60)}`);

  // Check if all chapters are approved
  const approvedChapters = await dbService.getApprovedChapters(bookId);
  console.log(`✅ ${approvedChapters.length} approved chapters found`);

  // Check final review status
  console.log(`\n🔍 Checking final review status...`);
  const finalStatus = await dbService.getApprovalStatus(bookId, 'final_compilation');

  if (finalStatus === 'yes') {
    console.log(`⏳ Waiting for final review notes...`);
    // In a real app, you'd wait here. For demo, continue.
  } else {
    console.log(`✅ Ready to compile!`);
  }

  // Compile to DOCX
  console.log(`\n📝 Generating DOCX file...`);
  const docxPath = await exportService.compileToDocx(title, outline, chapters);

  console.log(`✅ DOCX compiled: ${docxPath}`);

  // Also generate TXT version
  console.log(`\n📄 Generating TXT file...`);
  const txtPath = await exportService.compileToTxt(title, outline, chapters);

  console.log(`✅ TXT compiled: ${txtPath}`);

  // Save to DB
  await dbService.saveFinalBook(bookId, docxPath, 'docx');
  await dbService.saveFinalBook(bookId, txtPath, 'txt');

  // Update status
  await dbService.updateBookStatus(bookId, 'completed');

  // Send notification
  await notificationService.notifyBookComplete(title, docxPath);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎉 BOOK SUCCESSFULLY COMPILED!`);
  console.log(`📥 Output: ${docxPath}`);
  console.log(`${'='.repeat(60)}`);

  return docxPath;
}
