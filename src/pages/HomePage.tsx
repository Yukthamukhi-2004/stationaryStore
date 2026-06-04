import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function HomePage() {
  const { isSignedIn } = useUser();

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Stationery</h1>
          <p className="hero-subtitle">
            Premium stationery supplies for creative minds and productive
            professionals.
          </p>
          <div className="hero-actions">
            {isSignedIn ? (
              <Link to="/profile" className="btn btn-primary">
                Your Profile
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className="btn btn-primary">
                  Sign In
                </Link>
                <Link to="/sign-up" className="btn btn-secondary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Us?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✏️</div>
            <h3>Premium Quality</h3>
            <p>
              Curated selection of the finest stationery from around the
              world.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚚</div>
            <h3>Fast Delivery</h3>
            <p>Free shipping on orders over $50. Delivered to your door.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure Checkout</h3>
            <p>
              Your account is protected with Clerk authentication and secure
              payments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
