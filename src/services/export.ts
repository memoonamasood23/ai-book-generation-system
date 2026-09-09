import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import { Chapter } from '../types';

/**
 * Smartly extracts the actual, human-readable chapter title from chapter content.
 * Handles markdown formatting, empty lines, and separate line headers.
 */
function getChapterTitle(ch: Chapter): string {
  const lines = ch.content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return 'Untitled Chapter';
  }

  // Remove markdown symbols if present (e.g., #, ##, ***, dashes)
  const cleanLine = (str: string) => str.replace(/^[#*\s\-]+|[#*\s\-]+$/g, '').trim();

  const firstLine = cleanLine(lines[0]);

  // Case 1: First line contains both chapter prefix and title (e.g. "Chapter 1: Introduction")
  const titleMatch = firstLine.match(/^Chapter\s+\d+\s*[:\-–—]\s*(.+)$/i);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // Case 2: First line is simply "Chapter 1" with no trailing title content
  if (/^Chapter\s+\d+$/i.test(firstLine)) {
    if (lines.length > 1) {
      return cleanLine(lines[1]);
    }
    return 'Untitled Chapter';
  }

  // Case 3: First line is already the raw chapter title itself
  return firstLine.substring(0, 50);
}

export class ExportService {
  async compileToDocx(
    title: string,
    outline: string,
    chapters: Chapter[]
  ): Promise<string> {
    const paragraphs: Paragraph[] = [];

    // Title page
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      new Paragraph({
        text: 'Automatically Generated Book',
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 },
      })
    );

    // Table of Contents (simplified)
    paragraphs.push(
      new Paragraph({
        text: 'Table of Contents',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      })
    );

    chapters.forEach((ch) => {
      const chapterTitle = getChapterTitle(ch);
      paragraphs.push(
        new Paragraph({
          text: `Chapter ${ch.chapter_number}: ${chapterTitle}`,
          spacing: { after: 100 },
        })
      );
    });

    paragraphs.push(new Paragraph({ text: '', spacing: { after: 400 } }));

    // Outline section
    paragraphs.push(
      new Paragraph({
        text: 'Book Outline',
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: outline,
        spacing: { after: 400 },
      })
    );

    // Chapters
    chapters.forEach((chapter) => {
      paragraphs.push(
        new Paragraph({
          text: `Chapter ${chapter.chapter_number}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 },
        })
      );

      // Split content into paragraphs
      const contentLines = chapter.content.split('\n');
      contentLines.forEach((line) => {
        if (line.trim()) {
          paragraphs.push(
            new Paragraph({
              text: line.trim(),
              spacing: { after: 100 },
            })
          );
        }
      });

      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: 200 },
        })
      );
    });

    // Create document
    const doc = new Document({
      sections: [
        {
          children: paragraphs,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Save to file
    const outputDir = path.join(
      process.cwd(),
      'output'
    );
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.docx`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, buffer);
    console.log(`✅ DOCX file saved: ${filePath}`);

    return filePath;
  }

  async compileToTxt(
    title: string,
    outline: string,
    chapters: Chapter[]
  ): Promise<string> {
    let content = `${title}\nAutomatically Generated Book\nGenerated on ${new Date().toLocaleDateString()}\n\n`;

    content += `OUTLINE:\n${outline}\n\n`;
    content += `${'='.repeat(80)}\n\n`;

    chapters.forEach((chapter) => {
      content += `Chapter ${chapter.chapter_number}\n${'-'.repeat(40)}\n${chapter.content}\n\n`;
    });

    const outputDir = path.join(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.txt`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ TXT file saved: ${filePath}`);

    return filePath;
  }
}

export const exportService = new ExportService();
