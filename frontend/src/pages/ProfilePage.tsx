import { SignOutButton, useAuth, useUser } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthenticatedSupabase } from "../lib/supabase";

type Profile = {
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = await getToken({ template: "supabase" });

        if (!token || !user) {
          setLoading(false);
          return;
        }

        const supabase = getAuthenticatedSupabase(token);
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("clerk_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          setError(error.message);
        } else {
          setProfile(data as Profile | null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      loadProfile();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [getToken, isLoaded, user]);

  if (!isLoaded) {
    return <div className="page-loading">Loading...</div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {user?.firstName?.charAt(0) ?? "U"}
            </div>
          )}
        </div>
        <h1>
          {user?.firstName} {user?.lastName}
        </h1>
        <p className="profile-email">{user?.primaryEmailAddress?.emailAddress}</p>
        <SignOutButton>
          <button className="btn btn-outline">Sign Out</button>
        </SignOutButton>
      </div>

      <div className="profile-details">
        <h2>Account Details</h2>

        {loading && <p className="status-message">Loading profile data...</p>}

        {error && (
          <div className="status-message error">
            <p>Could not load profile from database: {error}</p>
          </div>
        )}

        {profile && (
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Role</span>
              <span className="detail-value badge">{profile.role}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Member Since</span>
              <span className="detail-value">
                {new Date(profile.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {!loading && !profile && !error && (
          <p className="status-message">
            Your profile hasn't synced yet. This happens when the Clerk webhook
            hasn't processed your account. Try signing out and back in.
          </p>
        )}
      </div>

      <Link to="/" className="btn btn-link">
        &larr; Back to Home
      </Link>
    </div>
  );
}
