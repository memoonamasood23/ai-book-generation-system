import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Book, Outline, Chapter, Approval } from '../types';
import * as fs from 'fs';

export class DatabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
      console.warn('⚠️  Supabase credentials not found. Using local storage for demo.');
      this.supabase = null;
    } else {
      this.supabase = createClient(url, key);
    }
  }

  // Books
  async createBook(title: string): Promise<string> {
    if (!this.supabase) {
      const id = `book_${Date.now()}`;
      console.log(`📖 Local: Created book ${id}`);
      return id;
    }

    const { data, error } = await this.supabase
      .from('books')
      .insert({ title, status: 'pending' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateBookStatus(bookId: string, status: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📖 Local: Updated book ${bookId} status to ${status}`);
      return;
    }

    const { error } = await this.supabase
      .from('books')
      .update({ status, updated_at: new Date() })
      .eq('id', bookId);

    if (error) throw error;
  }

  // Outlines
  async createOutline(bookId: string, content: string, notes_before: string): Promise<string> {
    if (!this.supabase) {
      const id = `outline_${Date.now()}`;
      console.log(`📝 Local: Created outline ${id}`);
      return id;
    }

    const { data, error } = await this.supabase
      .from('outlines')
      .insert({ book_id: bookId, content, notes_before, status: 'generated' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getOutline(bookId: string): Promise<Outline | null> {
    if (!this.supabase) return null;

    const { data, error } = await this.supabase
      .from('outlines')
      .select('*')
      .eq('book_id', bookId)
      .single();

    if (error) return null;
    return data;
  }

  // Chapters
  async createChapter(
    bookId: string,
    chapterNumber: number,
    content: string,
    summary: string
  ): Promise<string> {
    if (!this.supabase) {
      const id = `chapter_${Date.now()}`;
      console.log(`📄 Local: Created chapter ${chapterNumber}`);
      return id;
    }

    const { data, error } = await this.supabase
      .from('chapters')
      .insert({ book_id: bookId, chapter_number: chapterNumber, content, summary, status: 'generated' })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async getChapters(bookId: string): Promise<Chapter[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });

    if (error) return [];
    return data || [];
  }

  async getApprovedChapters(bookId: string): Promise<Chapter[]> {
    if (!this.supabase) return [];

    const { data, error } = await this.supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .eq('status', 'approved')
      .order('chapter_number', { ascending: true });

    if (error) return [];
    return data || [];
  }

  // Approvals
  async setApprovalStatus(bookId: string, stage: string, status: string, notes?: string): Promise<void> {
    if (!this.supabase) {
      console.log(`✅ Local: Set approval for ${stage} to ${status}`);
      return;
    }

    const { error } = await this.supabase
      .from('approvals')
      .upsert(
        { book_id: bookId, stage, status, notes, created_at: new Date() },
        { onConflict: 'book_id,stage' }
      );

    if (error) throw error;
  }

  async getApprovalStatus(bookId: string, stage: string): Promise<string | null> {
    if (!this.supabase) return 'no_notes_needed'; // Default for demo

    const { data, error } = await this.supabase
      .from('approvals')
      .select('status')
      .eq('book_id', bookId)
      .eq('stage', stage)
      .single();

    if (error) return null;
    return data?.status || null;
  }

  // Final Book
  async saveFinalBook(bookId: string, filePath: string, format: string): Promise<void> {
    if (!this.supabase) {
      console.log(`📦 Local: Saved final book to ${filePath}`);
      return;
    }

    const { error } = await this.supabase
      .from('final_books')
      .insert({ book_id: bookId, file_path: filePath, format });

    if (error) throw error;
  }
}

export const dbService = new DatabaseService();
