import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { OrderService } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import type { Order } from '../types';

const statusColors: Record<string, string> = {
  Pending: 'badge-warning',
  Paid: 'badge-info',
  Cooking: 'badge-primary',
  Ready: 'badge-success',
  Completed: 'badge-success',
  Cancelled: 'badge-error',
};

export const Orders: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await OrderService.getAll();
        setOrders(res.data);
      } catch {
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const locale = language === 'uk' ? uk : enUS;
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale });
    } catch {
      return dateStr;
    }
  };

  const handlePay = async (orderId: number) => {
    try {
      await OrderService.pay(orderId);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status: 'Paid' } : o));
    } catch { }
  };

  if (isLoading) {
    return <div className="loading-overlay"><div className="spinner" /><p>{t('loading')}</p></div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <h2 className="mb-6">{t('my_orders')}</h2>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>{t('no_orders')}</h3>
          <p className="mt-2">{t('no_orders_desc')}</p>
          <Link to="/restaurants" className="btn btn-primary mt-4">{t('browse_restaurants')}</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-3" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <div className="flex items-center gap-3">
                  <h4>#{order.id}</h4>
                  <span className={`badge ${statusColors[order.status] || 'badge-primary'}`}>
                    {t(order.status.toLowerCase())}
                  </span>
                </div>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {order.items.map((item, i) => (
                  <span key={i}>
                    {item.dishName} × {item.quantity}
                    {i < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>

              {order.visitTime && (
                <div className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  🕐 {t('pickup_time')}: {formatDate(order.visitTime)}
                </div>
              )}

              <div className="flex items-center justify-between mt-3" style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  ₴{order.totalAmount}
                </span>
                <div className="flex gap-2">
                  {order.status === 'Pending' && (
                    <button onClick={() => handlePay(order.id)} className="btn btn-sm btn-primary">
                      💳 {t('confirm')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
