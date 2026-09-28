import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const ADMIN_UID = "37021bfc-2f8c-4f4a-b971-3c99225a0e9a";

export default function ProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id === ADMIN_UID) {
        setAuthorized(true);
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return null;
  }

  if (!authorized) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
