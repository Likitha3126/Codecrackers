import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session?.user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-center">Checking auth...</div>;
  if (!authed) return <Navigate to="/" replace />;
  return children;
};

export default RequireAuth;
