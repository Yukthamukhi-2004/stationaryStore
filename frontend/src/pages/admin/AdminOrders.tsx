import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PageTransition from "../../components/PageTransition";
import { api, type Order, type OrderItem, type Payment } from "../../lib/api";

const ORDER_PAGE_SIZE = 10;
const EDITABLE_ORDER_STATUSES = [
  "Pending",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [orderSort, setOrderSort] = useState("newest");
  const [orderPage, setOrderPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const detailsRequestId = useRef(0);

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
      alert(
        err instanceof Error ? err.message : "Failed to update order status",
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const openOrderDetails = async (order: Order) => {
    const requestId = ++detailsRequestId.current;
    setSelectedOrder(order);
    setOrderItems([]);
    setOrderPayments([]);
    setItemsError(null);
    setPaymentsError(null);
    setDetailsLoading(true);

    const [itemsResult, paymentsResult] = await Promise.allSettled([
      api.getOrderItems(order.id),
      api.getPayments(),
    ]);
    if (requestId !== detailsRequestId.current) return;

    if (itemsResult.status === "fulfilled") {
      setOrderItems(itemsResult.value);
    } else {
      setItemsError(
        itemsResult.reason instanceof Error
          ? itemsResult.reason.message
          : "Could not load order items",
      );
    }

    if (paymentsResult.status === "fulfilled") {
      setOrderPayments(
        paymentsResult.value.filter((payment) => payment.order_id === order.id),
      );
    } else {
      setPaymentsError(
        paymentsResult.reason instanceof Error
          ? paymentsResult.reason.message
          : "Could not load payment information",
      );
    }
    setDetailsLoading(false);
  };

  const closeOrderDetails = () => {
    detailsRequestId.current += 1;
    setSelectedOrder(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "placed":
        return "status-placed";
      case "pending":
        return "status-pending";
      case "shipped":
        return "status-shipped";
      case "delivered":
        return "status-delivered";
      case "cancelled":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  const availableStatuses = Array.from(
    new Set(orders.map((order) => order.status)),
  ).sort((left, right) => left.localeCompare(right));
  const searchTerm = orderSearch.trim().toLocaleLowerCase();
  const filteredOrders = orders
    .filter((order) => {
      const matchesSearch =
        !searchTerm ||
        [String(order.id), order.user_id, order.status].some((value) =>
          value.toLocaleLowerCase().includes(searchTerm),
        );
      return matchesSearch && (!statusFilter || order.status === statusFilter);
    })
    .sort((left, right) => {
      switch (orderSort) {
        case "oldest":
          return (
            new Date(left.created_at).getTime() -
            new Date(right.created_at).getTime()
          );
        case "amount-asc":
          return left.total_amount - right.total_amount;
        case "amount-desc":
          return right.total_amount - left.total_amount;
        case "id-asc":
          return left.id - right.id;
        case "id-desc":
          return right.id - left.id;
        default:
          return (
            new Date(right.created_at).getTime() -
            new Date(left.created_at).getTime()
          );
      }
    });
  const orderPageCount = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDER_PAGE_SIZE),
  );
  const currentOrderPage = Math.min(orderPage, orderPageCount);
  const visibleOrders = filteredOrders.slice(
    (currentOrderPage - 1) * ORDER_PAGE_SIZE,
    currentOrderPage * ORDER_PAGE_SIZE,
  );
  const displayedOrder = selectedOrder
    ? (orders.find((order) => order.id === selectedOrder.id) ?? selectedOrder)
    : null;

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
              <p>Manage customer orders ({orders.length} loaded)</p>
            </div>
          </div>
        </div>

        <div className="ref-filter-bar">
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="order-search">
              Search orders
            </label>
            <input
              id="order-search"
              className="ref-filter-input"
              type="search"
              placeholder="Order ID, customer, or status"
              value={orderSearch}
              onChange={(event) => {
                setOrderSearch(event.target.value);
                setOrderPage(1);
              }}
            />
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="order-status-filter">
              Status
            </label>
            <select
              id="order-status-filter"
              className="ref-filter-input"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setOrderPage(1);
              }}
            >
              <option value="">All statuses</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="ref-filter-group">
            <label className="ref-filter-label" htmlFor="order-sort">
              Sort by
            </label>
            <select
              id="order-sort"
              className="ref-filter-input"
              value={orderSort}
              onChange={(event) => {
                setOrderSort(event.target.value);
                setOrderPage(1);
              }}
            >
              <option value="newest">Date: newest first</option>
              <option value="oldest">Date: oldest first</option>
              <option value="amount-desc">Amount: high to low</option>
              <option value="amount-asc">Amount: low to high</option>
              <option value="id-desc">Order ID: high to low</option>
              <option value="id-asc">Order ID: low to high</option>
            </select>
          </div>
          {(orderSearch || statusFilter) && (
            <button
              className="ref-filter-clear-btn"
              type="button"
              onClick={() => {
                setOrderSearch("");
                setStatusFilter("");
                setOrderPage(1);
              }}
            >
              Clear filters
            </button>
          )}
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
              {visibleOrders.map((order) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <td className="admin-td-id">#{order.id}</td>
                  <td className="admin-td-name">
                    {order.user_id.slice(0, 8)}...
                  </td>
                  <td className="admin-td-price">
                    ₹{order.total_amount.toFixed(2)}
                  </td>
                  <td>
                    <span
                      className={`order-status ${getStatusColor(order.status)}`}
                    >
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
                      <button
                        className="btn btn-sm btn-outline"
                        type="button"
                        aria-label={`View details for order ${order.id}`}
                        onClick={() => void openOrderDetails(order)}
                      >
                        Details
                      </button>
                      <select
                        className="admin-status-select"
                        value={order.status}
                        onChange={(e) =>
                          handleStatusUpdate(order.id, e.target.value)
                        }
                        disabled={updatingId === order.id}
                      >
                        {!EDITABLE_ORDER_STATUSES.includes(order.status) && (
                          <option value={order.status} disabled>
                            {order.status}
                          </option>
                        )}
                        {EDITABLE_ORDER_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {visibleOrders.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="ref-empty-state">
                      <span className="ref-empty-icon">📭</span>
                      {orders.length === 0
                        ? "No orders yet."
                        : "No orders match these filters."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="ref-pagination">
            <div className="ref-pagination-info" role="status">
              Showing{" "}
              {filteredOrders.length === 0
                ? 0
                : (currentOrderPage - 1) * ORDER_PAGE_SIZE + 1}
              –
              {Math.min(
                currentOrderPage * ORDER_PAGE_SIZE,
                filteredOrders.length,
              )}{" "}
              of {filteredOrders.length} matching; {orders.length} loaded
            </div>
            <div className="ref-pagination-controls">
              <button
                className="ref-pagination-btn"
                type="button"
                aria-label="Previous orders page"
                disabled={currentOrderPage <= 1}
                onClick={() => setOrderPage(currentOrderPage - 1)}
              >
                Previous
              </button>
              <span className="ref-pagination-info">
                Page {currentOrderPage} of {orderPageCount}
              </span>
              <button
                className="ref-pagination-btn"
                type="button"
                aria-label="Next orders page"
                disabled={currentOrderPage >= orderPageCount}
                onClick={() => setOrderPage(currentOrderPage + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {displayedOrder && (
          <div
            className="admin-order-drawer-overlay"
            onClick={closeOrderDetails}
          >
            <aside
              className="admin-order-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="admin-order-drawer-title"
              onClick={(event) => event.stopPropagation()}
            >
              <header className="admin-order-drawer-header">
                <div>
                  <h2 id="admin-order-drawer-title">
                    Order #{displayedOrder.id}
                  </h2>
                  <p>
                    {new Date(displayedOrder.created_at).toLocaleString(
                      "en-IN",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </p>
                </div>
                <button
                  className="admin-order-drawer-close"
                  type="button"
                  aria-label="Close order details"
                  onClick={closeOrderDetails}
                >
                  ×
                </button>
              </header>

              <dl className="admin-order-overview">
                <div>
                  <dt>Customer ID</dt>
                  <dd>{displayedOrder.user_id}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={`order-status ${getStatusColor(displayedOrder.status)}`}
                    >
                      {displayedOrder.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Order total</dt>
                  <dd>₹{displayedOrder.total_amount.toFixed(2)}</dd>
                </div>
              </dl>

              <section className="admin-order-detail-section">
                <h3>Items</h3>
                {detailsLoading ? (
                  <p role="status">Loading order details...</p>
                ) : itemsError ? (
                  <p role="alert">Could not load items: {itemsError}</p>
                ) : orderItems.length > 0 ? (
                  <ul className="admin-order-item-list">
                    {orderItems.map((item) => (
                      <li key={item.id}>
                        <div>
                          <strong>
                            {item.products?.product_name ??
                              `Product #${item.product_id}`}
                          </strong>
                          <span>
                            ₹{item.price.toFixed(2)} × {item.quantity}
                          </span>
                        </div>
                        <strong>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No item records are available for this order.</p>
                )}
              </section>

              <section className="admin-order-detail-section">
                <h3>Payment</h3>
                {detailsLoading ? (
                  <p role="status">Loading payment information...</p>
                ) : paymentsError ? (
                  <p role="alert">
                    Could not load payment information: {paymentsError}
                  </p>
                ) : orderPayments.length > 0 ? (
                  <ul className="admin-order-payment-list">
                    {orderPayments.map((payment) => (
                      <li key={payment.id}>
                        <div>
                          <strong>
                            {payment.payment_method.replaceAll("_", " ")}
                          </strong>
                          <span>{payment.payment_status}</span>
                          <span>
                            {new Date(payment.created_at).toLocaleString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                        <strong>₹{payment.amount.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No payment record is available for this order.</p>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
