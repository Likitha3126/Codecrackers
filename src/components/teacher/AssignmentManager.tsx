import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, CheckCircle, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  student_id: string;
  content: string;
  submitted_at: string;
  profiles: {
    full_name: string;
  };
  grades: {
    marks: number;
    feedback: string | null;
  } | null;
}

export const AssignmentManager = ({ courseId, onBack }: { courseId: string; onBack: () => void }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  useEffect(() => {
    fetchAssignments();
  }, [courseId]);

  useEffect(() => {
    if (selectedAssignment) {
      fetchSubmissions(selectedAssignment);
    }
  }, [selectedAssignment]);

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from("assignments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setAssignments(data || []);
    }
  };

  const fetchSubmissions = async (assignmentId: string) => {
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        *,
        profiles!submissions_student_id_fkey(full_name),
        grades(marks, feedback)
      `)
      .eq("assignment_id", assignmentId);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Transform data to handle the single grade object
    const transformedData = (data || []).map((submission: any) => ({
      ...submission,
      grades: submission.grades && submission.grades.length > 0 ? submission.grades[0] : null,
    }));
    
    setSubmissions(transformedData);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("assignments").insert({
        course_id: courseId,
        title,
        description,
      });

      if (error) throw error;

      toast.success("Assignment created successfully!");
      setTitle("");
      setDescription("");
      fetchAssignments();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId: string) => {
    if (!gradeMarks || parseInt(gradeMarks) < 0 || parseInt(gradeMarks) > 100) {
      toast.error("Please enter a valid grade (0-100)");
      return;
    }

    try {
      const { error } = await supabase.from("grades").insert({
        submission_id: submissionId,
        marks: parseInt(gradeMarks),
        feedback: gradeFeedback || null,
      });

      if (error) throw error;

      toast.success("Grade submitted successfully!");
      setGradeMarks("");
      setGradeFeedback("");
      if (selectedAssignment) fetchSubmissions(selectedAssignment);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (selectedAssignment) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignments
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Submissions</CardTitle>
            <CardDescription>Review and grade student submissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submissions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No submissions yet</p>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{submission.profiles.full_name}</CardTitle>
                      {submission.grades ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Graded: {submission.grades.marks}/100
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>Submission</Label>
                        <p className="text-sm text-muted-foreground mt-1">{submission.content}</p>
                      </div>
                      {!submission.grades && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full">Grade Submission</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Grade Submission</DialogTitle>
                              <DialogDescription>Provide marks and optional feedback</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="marks">Marks (0-100)</Label>
                                <Input
                                  id="marks"
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={gradeMarks}
                                  onChange={(e) => setGradeMarks(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="feedback">Feedback (Optional)</Label>
                                <Textarea
                                  id="feedback"
                                  value={gradeFeedback}
                                  onChange={(e) => setGradeFeedback(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              <Button onClick={() => handleGrade(submission.id)} className="w-full">
                                Submit Grade
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      {submission.grades && submission.grades.feedback && (
                        <div>
                          <Label>Your Feedback</Label>
                          <p className="text-sm text-muted-foreground mt-1">{submission.grades.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
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
            <Plus className="h-5 w-5" />
            Create Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={3}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {assignments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No assignments yet</p>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="cursor-pointer hover:shadow-[var(--shadow-card-hover)] transition-shadow" onClick={() => setSelectedAssignment(assignment.id)}>
                <CardHeader>
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription>{assignment.description}</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};
