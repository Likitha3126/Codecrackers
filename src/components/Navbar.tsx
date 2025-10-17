import { GraduationCap, LogOut, User, Grid, BookOpen, Megaphone, ClipboardList, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

interface NavbarProps {
  userRole?: string;
  userName?: string;
}

export const Navbar = ({ userRole, userName }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">LearnHub</h1>
            <p className="text-xs font-medium text-primary capitalize">{userRole || 'Login'} Portal</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6">
          {[
            { to: "/dashboard", label: "Dashboard", icon: <Grid className="w-4 h-4" /> },
            { to: "/courses", label: "My Courses", icon: <BookOpen className="w-4 h-4" /> },
            { to: "/assignments", label: "Assignments", icon: <ClipboardList className="w-4 h-4" /> },
            { to: "/announcements", label: "Announcements", icon: <Megaphone className="w-4 h-4" /> },
            { to: "/grades", label: "Grades", icon: <User className="w-4 h-4" /> },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 text-sm px-2 py-1 rounded-md ${location.pathname === item.to ? 'bg-muted/50' : 'hover:underline'}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">{userName}</span>
          <Link to="/profile" className="text-sm hidden sm:inline hover:underline">View profile</Link>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t bg-card/60 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
            <Link to="/dashboard" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>Dashboard</Link>
            <Link to="/courses" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>My Courses</Link>
            <Link to="/assignments" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>Assignments</Link>
            <Link to="/announcements" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>Announcements</Link>
            <Link to="/grades" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>Grades</Link>
            <Link to="/profile" className="flex items-center gap-2 text-sm" onClick={() => setOpen(false)}>View profile</Link>
            <button className="text-left text-sm text-foreground" onClick={() => { setOpen(false); handleLogout(); }}>Sign out</button>
          </div>
        </div>
      )}
    </nav>
  );
};
