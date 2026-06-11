import { SignOutButton, useAuth, useUser } from "@clerk/clerk-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getAuthenticatedSupabase } from "../lib/supabase";
import { useApp } from "../context/useApp";
import { api, type Order } from "../lib/api";

type Profile = {
  role: string;
  created_at: string;
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Orders from backend
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const { cart, cartCount, cartTotal, favorites } = useApp();
  const favoriteItems = Array.from(favorites);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      setOrders(data.filter((o) => o.user_id === user.id));
    } catch {
      // Silently fail — orders section will show fallback
    } finally {
      setLoadingOrders(false);
    }
  }, [user]);

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

        // Also fetch orders
        await fetchOrders();
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
  }, [getToken, isLoaded, user, fetchOrders]);

  if (!isLoaded) {
    return <div className="page-loading">Loading...</div>;
  }

  const displayName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User"
    : "User";
  const displayEmail = user?.primaryEmailAddress?.emailAddress ?? "N/A";
  const avatarInitial = user?.firstName?.charAt(0) ?? "U";

  return (
    <motion.div
      className="profile-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Profile"
              style={{
                borderRadius: "50%",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="avatar-initials">{avatarInitial}</div>
          )}
        </div>
        <h1>{displayName}</h1>
        <p className="profile-email">{displayEmail}</p>
        <div className="profile-badge">
          <span className="badge">{profile?.role ?? "Member"}</span>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <SignOutButton>
            <button className="btn btn-outline btn-sm">Sign Out</button>
          </SignOutButton>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-number">{cartCount}</span>
          <span className="stat-label">Cart Items</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{favoriteItems.length}</span>
          <span className="stat-label">Favourites</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {loadingOrders ? "..." : orders.length}
          </span>
          <span className="stat-label">Orders</span>
        </div>
      </div>

      {/* Personal Details */}
      <motion.div
        className="profile-details"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
      >
        <h2>Personal Details</h2>
        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Name</span>
            <span className="detail-value">{displayName}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email</span>
            <span className="detail-value">{displayEmail}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Phone</span>
            <span className="detail-value">+91 98765 43210</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Address</span>
            <span className="detail-value">123 Main Street, City</span>
          </div>
        </div>
      </motion.div>

      {/* DB Profile Info */}
      {profile && (
        <motion.div
          className="profile-details"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <h2>Account Info</h2>
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
        </motion.div>
      )}

      {!loading && !profile && !error && !user && (
        <motion.div
          className="profile-details"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.35 }}
        >
          <h2>Account Info</h2>
          <p className="status-message">
            <Link to="/auth">Sign in</Link> to see your profile details.
          </p>
        </motion.div>
      )}

      {/* Cart Summary */}
      {cart.length > 0 && (
        <motion.div
          className="profile-details"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
        >
          <h2>Cart Summary</h2>
          <div className="details-grid">
            {cart.slice(0, 5).map((item) => (
              <div key={item.id} className="detail-item">
                <span className="detail-label">{item.name}</span>
                <span className="detail-value">
                  ₹{item.price.toFixed(2)} × {item.quantity}
                </span>
              </div>
            ))}
            {cart.length > 5 && (
              <div className="detail-item">
                <span className="detail-label">
                  And {cart.length - 5} more items
                </span>
                <span className="detail-value">
                  <Link to="/orders">View all</Link>
                </span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Total</span>
              <span className="detail-value">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Favourites */}
      {favoriteItems.length > 0 && (
        <motion.div
          className="profile-details"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
        >
          <h2>Favourites ({favoriteItems.length})</h2>
          <div className="details-grid">
            {favoriteItems.map((id) => (
              <div key={id} className="detail-item">
                <span className="detail-label">Product #{id}</span>
                <span className="detail-value">♥ Favourited</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Order History */}
      <motion.div
        className="profile-details"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
      >
        <h2>Order History</h2>
        {loadingOrders ? (
          <div className="status-message">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-dot" />
              <div className="activity-content">
                <p className="activity-text">No orders yet</p>
                <span className="activity-time">
                  Start shopping to see your orders here
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="profile-orders-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="profile-order-item">
                <div className="profile-order-left">
                  <span className="profile-order-id">Order #{order.id}</span>
                  <span
                    className={`profile-order-status status-${order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="profile-order-right">
                  <span className="profile-order-amount">
                    ₹{order.total_amount.toFixed(2)}
                  </span>
                  <span className="profile-order-date">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {orders.length > 5 && (
              <div className="profile-order-more">
                <button
                  className="btn btn-link"
                  onClick={() => navigate("/orders")}
                >
                  View all {orders.length} orders &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <Link to="/" className="btn btn-link back-link">
        &larr; Back to Home
      </Link>
    </motion.div>
  );
}
