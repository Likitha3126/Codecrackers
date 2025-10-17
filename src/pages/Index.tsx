import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { AuthForm } from "@/components/AuthForm";
import { Navbar } from "@/components/Navbar";
import { CreateCourse } from "@/components/teacher/CreateCourse";
import { TeacherCourses } from "@/components/teacher/TeacherCourses";
import { AssignmentManager } from "@/components/teacher/AssignmentManager";
import { CourseList } from "@/components/student/CourseList";
import { EnrolledCourses } from "@/components/student/EnrolledCourses";
import { AssignmentView } from "@/components/student/AssignmentView";
import { GradesView } from "@/components/student/GradesView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [viewGrades, setViewGrades] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        // Clear all state on logout
        setProfile(null);
        setSelectedCourse(null);
        setViewGrades(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!user || !profile) {
    return <AuthForm />;
  }

  if (viewGrades) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navbar userRole={profile.role} userName={profile.full_name} />
        <main className="container mx-auto px-4 py-8">
          <GradesView onBack={() => setViewGrades(false)} />
        </main>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navbar userRole={profile.role} userName={profile.full_name} />
        <main className="container mx-auto px-4 py-8">
          {profile.role === "teacher" ? (
            <AssignmentManager
              courseId={selectedCourse}
              onBack={() => setSelectedCourse(null)}
            />
          ) : (
            <AssignmentView
              courseId={selectedCourse}
              onBack={() => setSelectedCourse(null)}
            />
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar userRole={profile.role} userName={profile.full_name} />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {profile.full_name}!</h2>
          <p className="text-muted-foreground">
            {profile.role === "teacher"
              ? "Manage your courses and track student progress"
              : "Continue your learning journey"}
          </p>
        </div>

        {profile.role === "teacher" ? (
          <Tabs defaultValue="courses" className="space-y-6">
            <TabsList>
              <TabsTrigger value="courses">My Courses</TabsTrigger>
              <TabsTrigger value="create">Create Course</TabsTrigger>
            </TabsList>
            <TabsContent value="courses" className="space-y-6">
              <TeacherCourses key={refreshKey} onSelectCourse={setSelectedCourse} />
            </TabsContent>
            <TabsContent value="create">
              <CreateCourse onSuccess={handleRefresh} />
            </TabsContent>
          </Tabs>
        ) : (
          <Tabs defaultValue="enrolled" className="space-y-6">
            <TabsList>
              <TabsTrigger value="enrolled">My Courses</TabsTrigger>
              <TabsTrigger value="browse">Browse Courses</TabsTrigger>
            </TabsList>
            <TabsContent value="enrolled" className="space-y-6">
              <EnrolledCourses
                key={refreshKey}
                onSelectCourse={setSelectedCourse}
                onViewGrades={() => setViewGrades(true)}
              />
            </TabsContent>
            <TabsContent value="browse">
              <CourseList onEnroll={handleRefresh} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
};

export default Index;
