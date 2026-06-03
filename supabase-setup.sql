-- Supabase Setup Script for Pateros Quest Admin Dashboard
-- Copy and run this script in the Supabase SQL Editor (https://supabase.com/dashboard)

-- 1. Add role column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- 2. Create quiz_questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  answer INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create puzzle_images table
CREATE TABLE IF NOT EXISTS puzzle_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_images ENABLE ROW LEVEL SECURITY;

-- 5. Set up RLS Policies for quiz_questions
CREATE POLICY "Quiz questions are viewable by everyone" 
  ON quiz_questions FOR SELECT USING (true);

CREATE POLICY "Admins can insert quiz questions" 
  ON quiz_questions FOR INSERT 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update quiz questions" 
  ON quiz_questions FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete quiz questions" 
  ON quiz_questions FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 6. Set up RLS Policies for puzzle_images
CREATE POLICY "Puzzle images are viewable by everyone" 
  ON puzzle_images FOR SELECT USING (true);

CREATE POLICY "Admins can insert puzzle images" 
  ON puzzle_images FOR INSERT 
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update puzzle images" 
  ON puzzle_images FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete puzzle images" 
  ON puzzle_images FOR DELETE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- 7. Add policy for admins to manage user profiles (e.g. changing roles)
CREATE POLICY "Admins can update all profiles" 
  ON profiles FOR UPDATE 
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
