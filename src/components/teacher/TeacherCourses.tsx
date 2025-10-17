import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, FileText, FileUp } from "lucide-react";
import { toast } from "sonner";
import { PDFUpload } from "./PDFUpload";

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  created_at: string;
}

export const TeacherCourses = ({ onSelectCourse }: { onSelectCourse: (courseId: string) => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [selectedContentCourse, setSelectedContentCourse] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCourses(data || []);

      // Fetch enrollment counts for each course
      const counts: Record<string, number> = {};
      for (const course of data || []) {
        const { count } = await supabase
          .from("enrollments")
          .select("*", { count: "exact", head: true })
          .eq("course_id", course.id);
        counts[course.id] = count || 0;
      }
      setEnrollmentCounts(counts);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground">No courses yet. Create your first course above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {courses.map((course) => (
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
            <div className="flex items-center gap-6 mb-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{enrollmentCounts[course.id] || 0} students</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  onClick={() => onSelectCourse(course.id)}
                  variant="outline"
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Assignments
                </Button>
                <Button
                  variant={selectedContentCourse === course.id ? "secondary" : "outline"}
                  className="flex-1"
                  onClick={() => setSelectedContentCourse(
                    selectedContentCourse === course.id ? null : course.id
                  )}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Course Content
                </Button>
              </div>
            </div>
          </CardContent>
          {selectedContentCourse === course.id && (
            <CardContent className="border-t">
              <PDFUpload courseId={course.id} />
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
