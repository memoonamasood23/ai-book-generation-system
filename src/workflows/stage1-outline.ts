import { dbService } from '../services/database';
import { llmService } from '../services/llm';
import { notificationService } from '../services/notifications';

export async function generateOutlineStage(
  bookId: string,
  title: string,
  notesBeforeGeneration: string
): Promise<string> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📋 STAGE 1: OUTLINE GENERATION for "${title}"`);
  console.log(`${'='.repeat(60)}`);

  // Gating: Check if notes_before exists
  if (!notesBeforeGeneration || notesBeforeGeneration.trim().length === 0) {
    console.log(`❌ No notes provided. Waiting for editor input...`);
    await dbService.setApprovalStatus(bookId, 'outline', 'no');
    throw new Error('No notes_before provided. Please add notes to proceed.');
  }

  console.log(`✅ Notes received: "${notesBeforeGeneration}"`);

  // Generate outline
  console.log(`🤖 Calling OpenAI to generate outline...`);
  const outline = await llmService.generateOutline(title, notesBeforeGeneration);

  console.log(`\n📝 Generated Outline:\n${outline}`);

  // Store in DB
  await dbService.createOutline(bookId, outline, notesBeforeGeneration);
  await dbService.setApprovalStatus(bookId, 'outline', 'yes'); // Waiting for approval

  // Notify editor
  await notificationService.notifyOutlineReady(title);

  console.log(`\n✅ Outline generated and sent for review!`);
  console.log(`⏸️  Waiting for editor approval (status: 'no_notes_needed')...`);

  return outline;
}

export async function waitForOutlineApproval(bookId: string, maxWaitTime: number = 5000): Promise<void> {
  console.log(`\n⏳ Polling for outline approval...`);

  const startTime = Date.now();
  const pollInterval = 1000;

  while (Date.now() - startTime < maxWaitTime) {
    const status = await dbService.getApprovalStatus(bookId, 'outline');

    if (status === 'no_notes_needed') {
      console.log(`✅ Outline approved! Moving to chapter generation...`);
      return;
    }

    if (status === 'no') {
      throw new Error('Outline was rejected. Pausing workflow.');
    }

    console.log(`⏳ Still waiting... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // For demo: auto-approve if time runs out
  console.log(`⏰ Demo: Auto-approving after timeout...`);
}
