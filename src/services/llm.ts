import OpenAI from 'openai';

export class LLMService {
  private openai: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || 'mock-key-for-demo';
    
    // Auto-detect Google Gemini API key (starts with AIzaSy)
    const isGeminiKey = apiKey.startsWith('AIzaSy');
    
    const baseURL = process.env.OPENAI_BASE_URL || 
      (isGeminiKey ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined);
      
    this.model = process.env.OPENAI_MODEL || 
      (isGeminiKey ? 'gemini-2.5-flash' : 'gpt-4o');

    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: baseURL,
    });
  }

  async generateOutline(title: string, notes: string): Promise<string> {
    const prompt = `You are an expert book author. Create a detailed book outline for the following:

Title: ${title}

Editor Notes: ${notes}

Please provide a clear, structured outline with 5-7 main chapters. Format each chapter as:
Chapter N: [Chapter Title]
- Key point 1
- Key point 2
- Key point 3`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.warn(`⚠️  OpenAI API failed: ${(error as Error).message}, using mock outline`);
      return this.getMockOutline(title);
    }
  }

  async generateChapter(
    chapterTitle: string,
    chapterOutline: string,
    previousContext: string,
    notes?: string
  ): Promise<{ content: string; summary: string }> {
    const prompt = `You are an expert book author. Write a detailed chapter for a book.

Chapter: ${chapterTitle}
Outline: ${chapterOutline}

${previousContext ? `Context from previous chapters:\n${previousContext}\n` : ''}

${notes ? `Editor notes:\n${notes}\n` : ''}

Please write a comprehensive chapter (800-1000 words) that flows naturally from the previous content. 
After the chapter, provide a 2-3 sentence summary.

Format your response as:
[CHAPTER CONTENT HERE]

---SUMMARY---
[2-3 sentence summary]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      });

      const fullText = response.choices[0].message.content || '';
      const [content, summaryPart] = fullText.split('---SUMMARY---');
      const summary = summaryPart?.trim() || 'Chapter generated.';

      return {
        content: content.trim(),
        summary: summary.trim(),
      };
    } catch (error) {
      console.warn(`⚠️  OpenAI API failed: ${(error as Error).message}, using mock chapter`);
      return this.getMockChapter(chapterTitle);
    }
  }

  private getMockOutline(title: string): string {
    return `Book Outline: ${title}

Chapter 1: Introduction
- Overview of the topic
- Key concepts
- Why this matters

Chapter 2: Foundations
- Basic principles
- Historical context
- Building blocks

Chapter 3: Core Concepts
- Main idea 1
- Main idea 2
- Applications

Chapter 4: Deep Dive
- Advanced topics
- Case studies
- Real-world examples

Chapter 5: Implementation
- Practical steps
- Tools and resources
- Best practices

Chapter 6: Conclusion
- Summary of key points
- Future implications
- Call to action`;
  }

  private getMockChapter(
    title: string
  ): { content: string; summary: string } {
    return {
      content: `
${title}

This chapter explores the fundamental concepts and principles related to ${title}. 
The reader will gain a comprehensive understanding of how these elements work together 
to create a cohesive framework.

Throughout history, the importance of ${title} has been recognized by scholars and practitioners alike. 
Modern research has shown that understanding ${title} is critical for success in today's world.

Key principles include attention to detail, continuous learning, and practical application of concepts. 
By implementing these principles, individuals and organizations can achieve significant improvements 
in their respective fields.

The following sections will delve deeper into each aspect, providing practical examples and case studies 
that demonstrate the real-world application of these concepts. Whether you are a beginner or an advanced practitioner, 
this chapter will provide valuable insights and actionable strategies.

Furthermore, the interconnection between different elements of ${title} creates a dynamic system where 
changes in one area can have cascading effects throughout. Understanding these relationships is essential 
for making informed decisions and developing effective strategies.

In conclusion, ${title} represents a critical area of study and practice that continues to evolve. 
As new research emerges and technologies advance, the landscape will undoubtedly change, but the fundamental 
principles remain constant and timeless.`,
      summary: `This chapter introduces ${title} and explores its fundamental principles, historical context, 
and practical applications. Key takeaways include the importance of understanding interconnections and 
staying adaptable as the field evolves.`,
    };
  }
}

export const llmService = new LLMService();
