import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import StudentLogin from "./pages/StudentLogin";
import TeacherLogin from "./pages/TeacherLogin";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import MyCourses from "./pages/MyCourses";
import Assignments from "./pages/Assignments";
import Announcements from "./pages/Announcements";
import Grades from "./pages/Grades";
import RequireAuth from "./components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/courses" element={<RequireAuth><MyCourses /></RequireAuth>} />
          <Route path="/assignments" element={<RequireAuth><Assignments /></RequireAuth>} />
          <Route path="/announcements" element={<RequireAuth><Announcements /></RequireAuth>} />
          <Route path="/grades" element={<RequireAuth><Grades /></RequireAuth>} />
          <Route path="/login/student" element={<StudentLogin />} />
          <Route path="/login/teacher" element={<TeacherLogin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
