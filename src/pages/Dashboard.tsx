import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FileItem = { id: string; title: string; url: string; course_id: string; created_at: string };
type EnrollmentItem = { id: string; course_id: string; student_id: string; enrolled_at: string; course_title?: string; student_name?: string };

const Dashboard = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [coursesCount, setCoursesCount] = useState(0);
  const [recentUploads, setRecentUploads] = useState<FileItem[]>([]);
  const [recentEnrollments, setRecentEnrollments] = useState<EnrollmentItem[]>([]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(profileData);

        if (profileData.role === 'teacher') {
          // Teacher: fetch teacher courses
          const { data: courses } = await supabase.from('courses').select('*').eq('teacher_id', profileData.id).order('created_at', { ascending: false });
          const courseIds = (courses || []).map((c: any) => c.id);
          setCoursesCount((courses || []).length);

          if (courseIds.length > 0) {
            const { data: files } = await supabase.from('files').select('*').in('course_id', courseIds).order('created_at', { ascending: false }).limit(5);
            setRecentUploads(files || []);

            const { data: enrolls } = await supabase.from('enrollments').select('*').in('course_id', courseIds).order('enrolled_at', { ascending: false }).limit(5);
            // Fetch student names for enrollments
            const studentIds = (enrolls || []).map((e: any) => e.student_id);
            const { data: students } = await supabase.from('profiles').select('id,full_name').in('id', studentIds);
            const studentMap: Record<string, string> = {};
            (students || []).forEach((s: any) => studentMap[s.id] = s.full_name);
            const courseMap: Record<string, string> = {};
            (courses || []).forEach((c: any) => courseMap[c.id] = c.title);
            setRecentEnrollments((enrolls || []).map((e: any) => ({
              id: e.id,
              course_id: e.course_id,
              student_id: e.student_id,
              enrolled_at: e.enrolled_at,
              course_title: courseMap[e.course_id],
              student_name: studentMap[e.student_id]
            })));
          }
        } else {
          // Student: count enrollments and fetch recent activity for their courses
          const { data: enrollments } = await supabase.from('enrollments').select('*').eq('student_id', profileData.id).order('enrolled_at', { ascending: false });
          setCoursesCount((enrollments || []).length);
          const courseIds = (enrollments || []).map((e: any) => e.course_id);

          if (courseIds.length > 0) {
            const { data: files } = await supabase.from('files').select('*').in('course_id', courseIds).order('created_at', { ascending: false }).limit(5);
            setRecentUploads(files || []);
            // Map enrollments with course titles
            const { data: courses } = await supabase.from('courses').select('id,title').in('id', courseIds);
            const courseMap: Record<string, string> = {};
            (courses || []).forEach((c: any) => courseMap[c.id] = c.title);
            setRecentEnrollments((enrollments || []).slice(0,5).map((e: any) => ({
              id: e.id,
              course_id: e.course_id,
              student_id: e.student_id,
              enrolled_at: e.enrolled_at,
              course_title: courseMap[e.course_id]
            })));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar userRole={profile?.role} userName={profile?.full_name} />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-4">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{coursesCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              {recentUploads.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent uploads</div>
              ) : (
                <ul className="space-y-2">
                  {recentUploads.map((f) => (
                    <li key={f.id} className="flex items-center justify-between">
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm hover:underline">{f.title}</a>
                      <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {recentEnrollments.length === 0 ? (
                <div className="text-sm text-muted-foreground">No recent enrollments</div>
              ) : (
                <ul className="space-y-2">
                  {recentEnrollments.map((e) => (
                    <li key={e.id} className="flex items-center justify-between">
                      <div className="text-sm">
                        {e.student_name ? <span className="font-medium">{e.student_name}</span> : null}
                        {e.course_title ? <span className="ml-2 text-muted-foreground">in {e.course_title}</span> : null}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Button asChild>
            <a href="/courses">Go to My Courses</a>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
