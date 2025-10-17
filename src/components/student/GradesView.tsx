import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface GradeData {
  id: string;
  marks: number;
  feedback: string | null;
  graded_at: string;
  submissions: {
    assignments: {
      title: string;
      courses: {
        title: string;
      };
    };
  };
}

export const GradesView = ({ onBack }: { onBack: () => void }) => {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("grades")
        .select(`
          *,
          submissions!grades_submission_id_fkey(
            assignments!submissions_assignment_id_fkey(
              title,
              courses!assignments_course_id_fkey(title)
            )
          )
        `)
        .eq("submissions.student_id", user.id)
        .order("graded_at", { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (marks: number) => {
    if (marks >= 90) return "default";
    if (marks >= 70) return "secondary";
    return "outline";
  };

  if (loading) {
    return <div className="text-center py-8">Loading grades...</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Courses
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Your Grades
          </CardTitle>
          <CardDescription>View all your assignment grades and feedback</CardDescription>
        </CardHeader>
        <CardContent>
          {grades.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No grades yet</p>
          ) : (
            <div className="space-y-4">
              {grades.map((grade) => (
                <Card key={grade.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          {grade.submissions.assignments.title}
                        </CardTitle>
                        <CardDescription>
                          {grade.submissions.assignments.courses.title}
                        </CardDescription>
                      </div>
                      <Badge variant={getGradeColor(grade.marks)}>
                        {grade.marks}/100
                      </Badge>
                    </div>
                  </CardHeader>
                  {grade.feedback && (
                    <CardContent>
                      <div>
                        <p className="text-sm font-medium mb-1">Feedback</p>
                        <p className="text-sm text-muted-foreground">{grade.feedback}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
