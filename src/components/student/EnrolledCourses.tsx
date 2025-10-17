import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, Trophy, FileUp } from "lucide-react";
import { CourseMaterials } from "./CourseMaterials";
import { toast } from "sonner";

interface EnrolledCourse {
  id: string;
  course_id: string;
  courses: {
    id: string;
    title: string;
    description: string;
    duration: string;
    profiles: {
      full_name: string;
    };
  };
}

export const EnrolledCourses = ({
  onSelectCourse,
  onViewGrades,
}: {
  onSelectCourse: (courseId: string) => void;
  onViewGrades: () => void;
}) => {
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMaterials, setOpenMaterials] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select(`
          *,
          courses!enrollments_course_id_fkey(
            id,
            title,
            description,
            duration,
            profiles!courses_teacher_id_fkey(full_name)
          )
        `)
        .eq("student_id", user.id)
        .order("enrolled_at", { ascending: false });

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your courses...</div>;
  }

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={onViewGrades}>
          <Trophy className="h-4 w-4 mr-2" />
          View All Grades
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {enrollments.map((enrollment) => (
          <Card key={enrollment.id} className="hover:shadow-[var(--shadow-card-hover)] transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl">{enrollment.courses.title}</CardTitle>
                  <CardDescription className="mt-2">{enrollment.courses.description}</CardDescription>
                </div>
                <Badge variant="secondary">{enrollment.courses.duration}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Instructor: {enrollment.courses.profiles.full_name}
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => onSelectCourse(enrollment.courses.id)}
                  variant="outline"
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Assignments
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setOpenMaterials(enrollment.courses.id === openMaterials ? null : enrollment.courses.id)}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  Course Materials
                </Button>
              </div>
              {openMaterials === enrollment.courses.id && (
                <div className="mt-4 border-t pt-4">
                  <CourseMaterials courseId={enrollment.courses.id} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
