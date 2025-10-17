import { Navbar } from "@/components/Navbar";
import { TeacherCourses } from "@/components/teacher/TeacherCourses";
import { EnrolledCourses } from "@/components/student/EnrolledCourses";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const MyCourses = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      }
    };
    fetch();
  }, []);

  if (!profile) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar userRole={profile.role} userName={profile.full_name} />
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">My Courses</h2>
        {profile.role === 'teacher' ? (
          <TeacherCourses onSelectCourse={() => {}} />
        ) : (
          <EnrolledCourses onSelectCourse={() => {}} onViewGrades={() => {}} />
        )}
      </main>
    </div>
  );
};

export default MyCourses;
