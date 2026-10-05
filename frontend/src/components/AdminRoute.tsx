import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import { useUser } from "../context/useUser";
import { api } from "../lib/api";
import supabase from "../lib/supabase";

type AccessState = "checking" | "allowed" | "denied" | "error";

export default function AdminRoute() {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const [access, setAccess] = useState<AccessState>("checking");
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isLoaded || !user) return;

    let cancelled = false;
    const complete = (result: AccessState) => {
      if (cancelled) return;
      setAccess(result);
      setCheckedUserId(user.id);
    };

    const verify = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) {
          complete("denied");
          return;
        }
        const result = await api.verifyAdmin(session.access_token);
        complete(result.authorized ? "allowed" : "denied");
      } catch (error) {
        const status = (error as { status?: number }).status;
        complete(status === 401 || status === 403 ? "denied" : "error");
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [attempt, isLoaded, user]);

  const currentAccess = user && checkedUserId === user.id ? access : "checking";

  if (!isLoaded || (user && currentAccess === "checking")) {
    return (
      <div className="admin-access-state" role="status">
        Checking admin access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/shopping/auth" replace state={{ from: location }} />;
  }

  if (currentAccess === "denied") {
    return (
      <main className="admin-access-state" role="alert">
        <h1>Admin access required</h1>
        <p>This account does not have permission to open the admin panel.</p>
        <Link to="/shopping/home">Return to store</Link>
      </main>
    );
  }

  if (currentAccess === "error") {
    return (
      <main className="admin-access-state" role="alert">
        <h1>Could not verify admin access</h1>
        <p>Please check your connection and try again.</p>
        <button
          onClick={() => {
            setCheckedUserId(null);
            setAccess("checking");
            setAttempt((current) => current + 1);
          }}
        >
          Try again
        </button>
      </main>
    );
  }

  return <AdminLayout />;
}
