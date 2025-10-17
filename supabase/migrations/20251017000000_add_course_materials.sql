-- Create files table for course materials
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- Files policies
CREATE POLICY "Anyone can view files"
  ON public.files FOR SELECT
  USING (true);

CREATE POLICY "Teachers can upload files for their courses"
  ON public.files FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete files from their courses"
  ON public.files FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND teacher_id = auth.uid()
    )
  );

-- Enable storage for course materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-materials', 'course-materials', true);

-- Storage policies for course materials
CREATE POLICY "Allow public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-materials');

CREATE POLICY "Allow teachers to upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-materials' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Allow teachers to delete their files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-materials' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );