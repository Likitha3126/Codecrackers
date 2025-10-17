-- Create a table for course files
CREATE TABLE IF NOT EXISTS files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Policies for files table
CREATE POLICY "Teachers can manage their course files"
  ON files
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = files.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view enrolled course files"
  ON files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      JOIN courses ON courses.id = enrollments.course_id
      WHERE courses.id = files.course_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-materials', 'course-materials', true)
ON CONFLICT (id) DO NOTHING;