export interface Book {
  id: string;
  title: string;
  status: 'pending' | 'outline_review' | 'chapter_generation' | 'compilation' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
}

export interface Outline {
  id: string;
  book_id: string;
  content: string;
  notes_before: string;
  notes_after?: string;
  status: 'pending' | 'generated' | 'awaiting_approval' | 'approved';
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  content: string;
  summary: string;
  notes?: string;
  status: 'pending' | 'generated' | 'awaiting_approval' | 'approved';
  created_at: string;
}

export interface Approval {
  id: string;
  book_id: string;
  stage: string;
  status: 'yes' | 'no' | 'no_notes_needed';
  notes?: string;
  created_at: string;
}

export interface FinalBook {
  id: string;
  book_id: string;
  file_path: string;
  format: 'docx' | 'pdf' | 'txt';
  created_at: string;
}

export interface BookInput {
  title: string;
  notes_before: string;
  notes_after?: string;
}
