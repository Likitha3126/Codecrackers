import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  profiles: {
    full_name: string;
  };
}

export const CourseList = ({ onEnroll }: { onEnroll: () => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select(`
          *,
          profiles!courses_teacher_id_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("student_id", user.id);

      if (enrollmentsError) throw enrollmentsError;

      setCourses(coursesData || []);
      setEnrolledCourseIds(new Set(enrollmentsData?.map((e) => e.course_id) || []));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("enrollments").insert({
        course_id: courseId,
        student_id: user.id,
      });

      if (error) throw error;

      toast.success("Enrolled successfully!");
      fetchCourses();
      onEnroll();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading courses...</div>;
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No courses available yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const isEnrolled = enrolledCourseIds.has(course.id);
        return (
          <Card key={course.id} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <CardDescription className="mt-2">{course.description}</CardDescription>
                </div>
                <Badge variant="secondary">{course.duration}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{course.profiles.full_name}</span>
              </div>
              <Button
                onClick={() => handleEnroll(course.id)}
                disabled={isEnrolled}
                className="w-full"
                variant={isEnrolled ? "outline" : "default"}
              >
                {isEnrolled ? "Enrolled" : "Enroll Now"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
