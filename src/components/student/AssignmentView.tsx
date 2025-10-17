import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
}

interface Submission {
  id: string;
  content: string;
  submitted_at: string;
  grades: Array<{
    marks: number;
    feedback: string | null;
  }>;
}

export const AssignmentView = ({ courseId, onBack }: { courseId: string; onBack: () => void }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  const fetchAssignments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("course_id", courseId)
        .order("created_at", { ascending: false });

      if (assignmentsError) throw assignmentsError;

      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select(`
          *,
          grades(marks, feedback)
        `)
        .eq("student_id", user.id);

      if (submissionsError) throw submissionsError;

      setAssignments(assignmentsData || []);

      const submissionsMap: Record<string, Submission> = {};
      submissionsData?.forEach((sub: any) => {
        submissionsMap[sub.assignment_id] = sub;
      });
      setSubmissions(submissionsMap);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmit = async (assignmentId: string) => {
    if (!content[assignmentId]?.trim()) {
      toast.error("Please enter your submission content");
      return;
    }

    setLoading({ ...loading, [assignmentId]: true });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("submissions").insert({
        assignment_id: assignmentId,
        student_id: user.id,
        content: content[assignmentId],
      });

      if (error) throw error;

      toast.success("Assignment submitted successfully!");
      setContent({ ...content, [assignmentId]: "" });
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading({ ...loading, [assignmentId]: false });
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Courses
      </Button>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No assignments available yet</p>
          </CardContent>
        </Card>
      ) : (
        assignments.map((assignment) => {
          const submission = submissions[assignment.id];
          const isGraded = submission?.grades && submission.grades.length > 0;

          return (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{assignment.title}</CardTitle>
                    <CardDescription className="mt-2">{assignment.description}</CardDescription>
                  </div>
                  {submission ? (
                    isGraded ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {submission.grades[0].marks}/100
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Submitted
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline">Not Submitted</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission ? (
                  <>
                    <div>
                      <Label>Your Submission</Label>
                      <p className="text-sm text-muted-foreground mt-1">{submission.content}</p>
                    </div>
                    {isGraded && submission.grades[0].feedback && (
                      <div>
                        <Label>Teacher's Feedback</Label>
                        <p className="text-sm text-muted-foreground mt-1">{submission.grades[0].feedback}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor={`content-${assignment.id}`}>Your Answer</Label>
                      <Textarea
                        id={`content-${assignment.id}`}
                        placeholder="Type your answer here..."
                        value={content[assignment.id] || ""}
                        onChange={(e) =>
                          setContent({ ...content, [assignment.id]: e.target.value })
                        }
                        rows={5}
                      />
                    </div>
                    <Button
                      onClick={() => handleSubmit(assignment.id)}
                      disabled={loading[assignment.id]}
                      className="w-full"
                    >
                      {loading[assignment.id] ? "Submitting..." : "Submit Assignment"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
