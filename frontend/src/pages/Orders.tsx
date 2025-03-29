import React, { useEffect, useState } from 'react';
import { getOrders } from '../services/apiService';
import { OrderDetails } from '../services/types';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load orders');
        setLoading(false);
      }
    };
    
    fetchOrders();
    
    // Refresh orders every 10 seconds
    const intervalId = setInterval(fetchOrders, 10000);
    
    return () => clearInterval(intervalId);
  }, []);

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'bg-secondary';
      case 'In Progress':
        return 'bg-primary';
      case 'Completed':
        return 'bg-success';
      default:
        return 'bg-info';
    }
  };

  const getProgressPercentage = (order: OrderDetails): number => {
    return Math.min(100, Math.round((order.quantityProduced / order.quantityRequired) * 100));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <div className="row mb-4">
        <div className="col-md-12">
          <div className="panel">
            <h3>
              <i className="bi bi-card-list"></i> Production Orders
            </h3>
            <p>Current manufacturing orders and their status.</p>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-12">
          <div className="panel">
            {orders.length === 0 ? (
              <div className="alert alert-info">
                No orders found in the system.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Product</th>
                      <th>Status</th>
                      <th>Quantity</th>
                      <th>Due Date</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>{order.orderId}</td>
                        <td>{order.productName}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.quantityProduced} / {order.quantityRequired}</td>
                        <td>{new Date(order.dueDate).toLocaleDateString()}</td>
                        <td>
                          <div className="progress">
                            <div 
                              className={`progress-bar ${order.status === 'Completed' ? 'bg-success' : 'bg-primary'}`}
                              role="progressbar" 
                              style={{ width: `${getProgressPercentage(order)}%` }}
                              aria-valuenow={getProgressPercentage(order)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              {getProgressPercentage(order)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="panel">
            <h4>Production Schedule Overview</h4>
            <div className="alert alert-info">
              <i className="bi bi-info-circle-fill me-2"></i>
              Orders are processed in sequence, one at a time. Production will automatically move to the next order when current one is completed.
            </div>
            <p>
              <strong>Total Orders:</strong> {orders.length}
            </p>
            <p>
              <strong>Orders Completed:</strong> {orders.filter(o => o.status === 'Completed').length}
            </p>
            <p>
              <strong>Orders In Progress:</strong> {orders.filter(o => o.status === 'In Progress').length}
            </p>
            <p>
              <strong>Orders Pending:</strong> {orders.filter(o => o.status === 'Pending').length}
            </p>
          </div>
        </div>

        <div className="col-md-6">
          <div className="panel">
            <h4>Order Statistics</h4>
            <div className="card mb-3">
              <div className="card-body">
                <h5 className="card-title">Total Production Required</h5>
                <p className="card-text display-6">
                  {orders.reduce((total, order) => total + order.quantityRequired, 0)}
                </p>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Total Production Completed</h5>
                <p className="card-text display-6">
                  {orders.reduce((total, order) => total + order.quantityProduced, 0)}
                </p>
                <p className="text-muted">
                  {Math.round((orders.reduce((total, order) => total + order.quantityProduced, 0) / 
                  orders.reduce((total, order) => total + order.quantityRequired, 0)) * 100)}% of total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders; 