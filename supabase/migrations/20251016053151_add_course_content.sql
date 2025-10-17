-- Create a table for course content
CREATE TABLE IF NOT EXISTS course_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE course_content ENABLE ROW LEVEL SECURITY;

-- Policies for course_content
CREATE POLICY "Teachers can manage their course content"
  ON course_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = course_content.course_id
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view enrolled course content"
  ON course_content
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments
      JOIN courses ON courses.id = enrollments.course_id
      WHERE courses.id = course_content.course_id
      AND enrollments.student_id = auth.uid()
    )
  );

-- Create a storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Storage policies for course materials
CREATE POLICY "Teachers can upload course materials"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-materials' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = (SELECT course_id FROM course_content WHERE file_path = storage.objects.name LIMIT 1)
      AND courses.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can download course materials"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'course-materials');

CREATE POLICY "Teachers can delete their course materials"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-materials' AND
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = (SELECT course_id FROM course_content WHERE file_path = storage.objects.name LIMIT 1)
      AND courses.teacher_id = auth.uid()
    )
  );