-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('teacher', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Courses policies
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'teacher'
    )
  );

CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE
  USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete own courses"
  ON public.courses FOR DELETE
  USING (teacher_id = auth.uid());

-- Create enrollments table
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(course_id, student_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Enrollments policies
CREATE POLICY "Anyone can view enrollments"
  ON public.enrollments FOR SELECT
  USING (true);

CREATE POLICY "Students can enroll themselves"
  ON public.enrollments FOR INSERT
  WITH CHECK (
    student_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'student'
    )
  );

CREATE POLICY "Students can unenroll themselves"
  ON public.enrollments FOR DELETE
  USING (student_id = auth.uid());

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Anyone can view assignments"
  ON public.assignments FOR SELECT
  USING (true);

CREATE POLICY "Teachers can create assignments for their courses"
  ON public.assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update assignments for their courses"
  ON public.assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete assignments for their courses"
  ON public.assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_id AND teacher_id = auth.uid()
    )
  );

-- Create submissions table
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Submissions policies
CREATE POLICY "Students can view own submissions"
  ON public.submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Teachers can view submissions for their courses"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.courses c ON a.course_id = c.id
      WHERE a.id = assignment_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can create own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update own submissions"
  ON public.submissions FOR UPDATE
  USING (student_id = auth.uid());

-- Create grades table
CREATE TABLE public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE UNIQUE,
  marks INTEGER NOT NULL CHECK (marks >= 0 AND marks <= 100),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Grades policies
CREATE POLICY "Students can view own grades"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE id = submission_id AND student_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can view grades for their courses"
  ON public.grades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can create grades for their courses"
  ON public.grades FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update grades for their courses"
  ON public.grades FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.submissions s
      JOIN public.assignments a ON s.assignment_id = a.id
      JOIN public.courses c ON a.course_id = c.id
      WHERE s.id = submission_id AND c.teacher_id = auth.uid()
    )
  );

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();