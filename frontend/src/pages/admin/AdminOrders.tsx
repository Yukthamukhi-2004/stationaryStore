import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Order } from "../../lib/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  async function loadOrders() {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.updateOrder(id, { status: newStatus });
      await loadOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update order status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed": return "status-placed";
      case "pending": return "status-pending";
      case "shipped": return "status-shipped";
      case "delivered": return "status-delivered";
      case "cancelled": return "status-cancelled";
      default: return "status-pending";
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="admin-loading">Loading orders...</div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="admin-error">⚠️ {error}</div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="admin-page">
        {/* ═══ Gradient Header Banner ═══ */}
        <div className="ref-header">
          <div className="ref-header-content">
            <div className="ref-header-text">
              <h1>📋 Orders</h1>
              <p>Manage customer orders ({orders.length} total)</p>
            </div>
          </div>
        </div>

        {/* ═══ Orders Table ═══ */}
        <div className="ref-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="admin-td-id">#{order.id}</td>
                  <td className="admin-td-name">{order.user_id.slice(0, 8)}...</td>
                  <td className="admin-td-price">₹{order.total_amount.toFixed(2)}</td>
                  <td>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="admin-td-date">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td>
                    <div className="admin-order-actions">
                      <select
                        className="admin-status-select"
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                      >
                        <option value="Placed">Placed</option>
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ref-empty-state">
                      <span className="ref-empty-icon">📭</span>
                      No orders yet.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
