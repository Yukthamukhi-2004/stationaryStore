import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/useApp";
import { useUser } from "../context/useUser";
import { api, type Order } from "../lib/api";
import PageTransition from "../components/PageTransition";

const PERSONAL_DETAILS_KEY = "sarada_personal_details";

type PersonalDetails = {
  age: string;
  profession: string;
  address: string;
};

function loadPersonalDetails(): PersonalDetails {
  try {
    const raw = localStorage.getItem(PERSONAL_DETAILS_KEY);
    return raw ? (JSON.parse(raw) as PersonalDetails) : emptyPersonalDetails();
  } catch {
    return emptyPersonalDetails();
  }
}

function savePersonalDetails(details: PersonalDetails) {
  try {
    localStorage.setItem(PERSONAL_DETAILS_KEY, JSON.stringify(details));
  } catch {
    // ignore
  }
}

function emptyPersonalDetails(): PersonalDetails {
  return { age: "", profession: "", address: "" };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isLoaded, signOut, updateName } = useUser();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState<{
    id: number;
    user_id: string;
    email: string | null;
    name: string | null;
    role: string | null;
    created_at: string | null;
    updated_at: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editable name (synced to local user storage)
  const [editableName, setEditableName] = useState("");
  const userNameChanged = user && editableName !== user.name;

  // Sync editableName when user loads
  useEffect(() => {
    setEditableName(user?.name ?? "");
  }, [user]);

  // Editable personal details (localStorage-backed)
  const [personalDetails, setPersonalDetails] =
    useState<PersonalDetails>(loadPersonalDetails);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsSyncError, setDetailsSyncError] = useState<string | null>(null);

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
        if (!user) {
          setLoading(false);
          return;
        }

        const data = await api.getProfile(user.id);
        setProfile(data);

        // Also fetch orders
        await fetchOrders();
      } catch (err) {
        // 404 means no profile row yet — that's okay
        if (err instanceof Error && err.message === "Profile not found") {
          setProfile(null);
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load profile",
          );
        }
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded && user) {
      loadProfile();
    } else if (isLoaded) {
      setLoading(false);
    }
  }, [isLoaded, user, fetchOrders]);

  if (!isLoaded) {
    return <div className="page-loading">Loading...</div>;
  }

  const displayName = user ? user.name : "User";
  const displayEmail = user?.email ?? "N/A";
  const avatarInitial = user?.name?.charAt(0) ?? "U";

  return (
    <>
      <PageTransition>
        <motion.div
          className="profile-page"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <div className="avatar-initials">{avatarInitial}</div>
            </div>
            <h1>{displayName}</h1>
            <p className="profile-email">{displayEmail}</p>
            <div className="profile-badge">
              <span className="badge">{profile?.role ?? "Member"}</span>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              {user ? (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowSignOutModal(true)}
                >
                  Sign Out
                </button>
              ) : (
                <div className="profile-auth-actions">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      navigate("/shopping/auth", { state: { mode: "sign-in" } })
                    }
                  >
                    Sign In
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginLeft: "0.75rem" }}
                    onClick={() =>
                      navigate("/shopping/auth", { state: { mode: "sign-up" } })
                    }
                  >
                    Sign Up
                  </button>
                </div>
              )}
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

          {/* Account Info from backend */}
          {profile && (
            <motion.div
              className="profile-details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <h2>Account Info</h2>
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
                  <span className="detail-label">Role</span>
                  <span className="detail-value badge">
                    {profile.role ?? "Member"}
                  </span>
                </div>
                {profile.created_at && (
                  <div className="detail-item">
                    <span className="detail-label">Member Since</span>
                    <span className="detail-value">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
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
                <Link to="/shopping/auth">Sign in</Link> to see your profile
                details.
              </p>
            </motion.div>
          )}

          {/* Personal Details — editable */}
          {user && (
            <motion.div
              className="profile-details"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
            >
              <h2>Personal Details</h2>
              <div className="details-grid personal-details-form">
                <div className="form-group">
                  <label htmlFor="pd-name">Name</label>
                  <input
                    id="pd-name"
                    className="form-input"
                    type="text"
                    placeholder="Your name"
                    value={editableName}
                    onChange={(e) => {
                      setDetailsSaved(false);
                      setEditableName(e.target.value);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pd-age">Age</label>
                  <input
                    id="pd-age"
                    className="form-input"
                    type="number"
                    min={1}
                    max={150}
                    placeholder="e.g. 25"
                    value={personalDetails.age}
                    onChange={(e) => {
                      setDetailsSaved(false);
                      setPersonalDetails((prev) => ({
                        ...prev,
                        age: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pd-profession">Profession</label>
                  <input
                    id="pd-profession"
                    className="form-input"
                    type="text"
                    placeholder="e.g. Teacher, Artist, Engineer"
                    value={personalDetails.profession}
                    onChange={(e) => {
                      setDetailsSaved(false);
                      setPersonalDetails((prev) => ({
                        ...prev,
                        profession: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pd-address">Address</label>
                  <textarea
                    id="pd-address"
                    className="form-input"
                    rows={3}
                    placeholder="Your full address"
                    value={personalDetails.address}
                    onChange={(e) => {
                      setDetailsSaved(false);
                      setPersonalDetails((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="personal-details-actions">
                  <motion.button
                    className="btn btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={savingDetails}
                    onClick={async () => {
                      setSavingDetails(true);
                      setDetailsSyncError(null);

                      // Save name to local user storage
                      if (userNameChanged) {
                        updateName(editableName);
                      }

                      // Save to localStorage
                      savePersonalDetails(personalDetails);

                      // Sync to backend API
                      if (user) {
                        try {
                          const ageNum = personalDetails.age
                            ? parseInt(personalDetails.age, 10)
                            : null;
                          const payload: Record<string, unknown> = {
                            age: ageNum,
                            profession: personalDetails.profession || null,
                            address: personalDetails.address || null,
                          };
                          // Only send name when it actually changed (avoid overwriting with null)
                          if (userNameChanged) {
                            payload.name = editableName;
                          }
                          await api.updateProfile(user.id, payload as any);
                          setDetailsSyncError(null);
                        } catch {
                          setDetailsSyncError(
                            "Saved locally, but failed to sync to server.",
                          );
                        }
                      }

                      setSavingDetails(false);
                      setDetailsSaved(true);
                      setTimeout(() => setDetailsSaved(false), 2500);
                    }}
                  >
                    {savingDetails
                      ? "Saving..."
                      : detailsSaved
                        ? "✓ Saved!"
                        : "Save Details"}
                  </motion.button>
                  {detailsSyncError && (
                    <p className="personal-details-error">{detailsSyncError}</p>
                  )}
                </div>
              </div>
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
                      <Link to="/shopping/orders">View all</Link>
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
                      <span className="profile-order-id">
                        Order #{order.id}
                      </span>
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
                        {new Date(order.created_at).toLocaleDateString(
                          "en-IN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                ))}
                {orders.length > 5 && (
                  <div className="profile-order-more">
                    <button
                      className="btn btn-link"
                      onClick={() => navigate("/shopping/orders")}
                    >
                      View all {orders.length} orders &rarr;
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          <Link to="/shopping/home" className="btn btn-link back-link">
            &larr; Back to Home
          </Link>
        </motion.div>
      </PageTransition>

      {/* Sign Out Confirmation Modal — portal to body to avoid transform context issues */}
      {createPortal(
        <AnimatePresence>
          {showSignOutModal && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                if (!signingOut) setShowSignOutModal(false);
              }}
            >
              <motion.div
                className="modal-card"
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-icon">
                  <svg
                    viewBox="0 0 48 48"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="36"
                    height="36"
                  >
                    <circle cx="24" cy="24" r="20" />
                    <line x1="24" y1="18" x2="24" y2="28" />
                    <line x1="24" y1="32" x2="24" y2="33" />
                  </svg>
                </div>
                <h3 className="modal-title">Leaving so soon?</h3>
                <p className="modal-message">
                  Are you sure you want to sign out? You'll need to sign in
                  again to access your profile and orders.
                </p>
                <div className="modal-actions">
                  <button
                    className="btn btn-outline"
                    disabled={signingOut}
                    onClick={() => setShowSignOutModal(false)}
                  >
                    No, stay
                  </button>
                  <button
                    className="btn btn-primary modal-btn-danger"
                    disabled={signingOut}
                    onClick={() => {
                      setSigningOut(true);
                      try {
                        signOut();
                        setSigningOut(false);
                        setShowSignOutModal(false);
                        navigate("/");
                      } catch {
                        setSigningOut(false);
                        setShowSignOutModal(false);
                      }
                    }}
                  >
                    {signingOut ? (
                      <span className="btn-spinner">⟳</span>
                    ) : (
                      "Yes, sign out"
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
