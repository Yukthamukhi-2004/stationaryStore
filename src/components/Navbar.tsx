import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function Navbar() {
  const { isSignedIn, user, isLoaded } = useUser();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Stationery
        </Link>

        <div className="navbar-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          {!isLoaded ? null : isSignedIn ? (
            <>
              <Link to="/profile" className="nav-link nav-profile">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="nav-avatar"
                  />
                ) : (
                  <span className="nav-avatar-placeholder">
                    {user?.firstName?.charAt(0) ?? "U"}
                  </span>
                )}
                <span>{user?.firstName}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/sign-in" className="nav-link">
                Sign In
              </Link>
              <Link to="/sign-up" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
