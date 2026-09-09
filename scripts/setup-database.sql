-- ==========================================
-- Supabase Schema for Automated Book Generation System
-- ==========================================

-- Enable UUID generation extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BOOKS TABLE
CREATE TABLE IF NOT EXISTS books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'outline_review', 'chapter_generation', 'compilation', 'completed', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. OUTLINES TABLE
CREATE TABLE IF NOT EXISTS outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    notes_before TEXT,
    notes_after TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'awaiting_approval', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CHAPTERS TABLE
CREATE TABLE IF NOT EXISTS chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    chapter_number INTEGER NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'awaiting_approval', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_book_chapter_number UNIQUE (book_id, chapter_number)
);

-- 4. APPROVALS TABLE
CREATE TABLE IF NOT EXISTS approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    stage TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'no_notes_needed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Unique constraint for onConflict: 'book_id,stage' during upserts
    CONSTRAINT unique_book_stage UNIQUE (book_id, stage)
);

-- 5. FINAL BOOKS TABLE
CREATE TABLE IF NOT EXISTS final_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID REFERENCES books(id) ON DELETE CASCADE NOT NULL,
    file_path TEXT NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('docx', 'pdf', 'txt')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- Performance Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_outlines_book_id ON outlines(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_approvals_book_id ON approvals(book_id);
CREATE INDEX IF NOT EXISTS idx_final_books_book_id ON final_books(book_id);

-- ==========================================
-- Supabase Realtime & Security Configuration (Optional)
-- Enable Row Level Security (RLS) if you want to restrict access, 
-- or disable it if you want quick prototyping.
-- ==========================================
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_books ENABLE ROW LEVEL SECURITY;

-- Simple permissive policies (allows authenticated/anon public access for demo testing)
CREATE POLICY "Enable all access for books" ON books FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for outlines" ON outlines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for chapters" ON chapters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for approvals" ON approvals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for final_books" ON final_books FOR ALL USING (true) WITH CHECK (true);
