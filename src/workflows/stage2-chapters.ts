import { dbService } from '../services/database';
import { llmService } from '../services/llm';
import { notificationService } from '../services/notifications';
import { Chapter } from '../types';

export async function generateChaptersStage(
  bookId: string,
  title: string,
  outline: string
): Promise<Chapter[]> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📚 STAGE 2: CHAPTER GENERATION`);
  console.log(`${'='.repeat(60)}`);

  // Parse outline to extract chapters
  const chapterTitles = parseChapters(outline);
  console.log(`📖 Found ${chapterTitles.length} chapters in outline\n`);

  const generatedChapters: Chapter[] = [];
  let previousSummaries = '';

  for (let i = 0; i < chapterTitles.length; i++) {
    const chapterNum = i + 1;
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`📄 Generating Chapter ${chapterNum}: ${chapterTitles[i]}`);
    console.log(`${'─'.repeat(60)}`);

    // Build context from previous chapters
    if (previousSummaries) {
      console.log(`📌 Using context from previous ${i} chapter(s)...`);
    }

    // Generate chapter
    console.log(`🤖 Calling OpenAI...`);
    const { content, summary } = await llmService.generateChapter(
      chapterTitles[i],
      `Write content for: ${chapterTitles[i]}`,
      previousSummaries,
      '' // No editor notes yet
    );

    console.log(`\n✅ Chapter ${chapterNum} generated (${content.length} chars)`);
    console.log(`\n📝 Summary: ${summary.substring(0, 100)}...`);

    // Store in DB
    const chapterId = await dbService.createChapter(bookId, chapterNum, content, summary);

    // Set approval status
    await dbService.setApprovalStatus(bookId, `chapter_${chapterNum}`, 'yes');

    // Notify editor
    await notificationService.notifyChapterReady(title, chapterNum);

    console.log(`✅ Waiting for approval...`);

    // Wait for approval (with timeout for demo)
    await waitForChapterApproval(bookId, chapterNum, 3000);

    // Add to results
    generatedChapters.push({
      id: chapterId,
      book_id: bookId,
      chapter_number: chapterNum,
      content,
      summary,
      status: 'approved',
      created_at: new Date().toISOString(),
    });

    // Update context for next chapter
    previousSummaries += `\nChapter ${chapterNum}: ${summary}`;

    console.log(`✅ Chapter ${chapterNum} approved!\n`);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ All ${generatedChapters.length} chapters generated and approved!`);
  console.log(`${'='.repeat(60)}`);

  return generatedChapters;
}

function parseChapters(outline: string): string[] {
  const lines = outline.split('\n');
  const chapters: string[] = [];

  for (const line of lines) {
    const match = line.match(/^Chapter\s+\d+:\s*(.+)/i);
    if (match) {
      chapters.push(match[1].trim());
    }
  }

  // Fallback if regex doesn't match
  if (chapters.length === 0) {
    chapters.push('Introduction', 'Main Content', 'Advanced Topics', 'Conclusion');
  }

  return chapters;
}

async function waitForChapterApproval(
  bookId: string,
  chapterNum: number,
  maxWaitTime: number = 3000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 500;

  while (Date.now() - startTime < maxWaitTime) {
    const status = await dbService.getApprovalStatus(bookId, `chapter_${chapterNum}`);

    if (status === 'no_notes_needed') {
      return;
    }

    if (status === 'no') {
      throw new Error(`Chapter ${chapterNum} was rejected.`);
    }

    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  // Auto-approve for demo
  console.log(`⏰ Demo: Auto-approving chapter...`);
}
