import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useSettingsStore } from '../store/settingsStore';
import { OrderService } from '../services/api';

export const Cart: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const { items, restaurantName, restaurantId, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore();

  const [visitTime, setVisitTime] = useState('');
  const [comment, setComment] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [error, setError] = useState('');

  const getMinTime = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return d.toTimeString().slice(0, 5);
  };

  const getDishName = (dish: { nameUA: string; nameEN: string }) =>
    language === 'uk' ? (dish.nameUA || dish.nameEN) : (dish.nameEN || dish.nameUA);

  const handlePlaceOrder = async () => {
    if (!restaurantId) return;
    if (!visitTime) {
      setError(t('pickup_time') + ' — ' + t('confirm'));
      return;
    }
    setIsOrdering(true);
    setError('');

    const now = new Date();
    const [hours, minutes] = visitTime.split(':').map(Number);
    const visitDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    if (visitDate <= now) {
      visitDate.setDate(visitDate.getDate() + 1);
    }

    try {
      await OrderService.create({
        restaurantId,
        visitTime: visitDate.toISOString(),
        items: items.map((i) => ({ dishId: i.dish.id, quantity: i.quantity })),
        comment: comment || undefined,
      });
      setOrderSuccess(true);
      clearCart();
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || t('error_occurred'));
    } finally {
      setIsOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ marginBottom: '0.5rem' }}>{t('order_placed')}</h2>
        <p style={{ marginBottom: '2rem' }}>{t('my_orders')}</p>
        <div className="flex gap-3" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/orders" className="btn btn-primary">{t('my_orders')}</Link>
          <Link to="/restaurants" className="btn btn-secondary">{t('browse_restaurants')}</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center" style={{ minHeight: 'calc(100vh - 200px)', textAlign: 'center', padding: '3rem 1.5rem' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🛒</div>
          <h3>{t('cart_empty')}</h3>
          <p className="mt-2">{t('cart_empty_desc')}</p>
          <Link to="/restaurants" className="btn btn-primary mt-4">{t('browse_restaurants')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2>{t('your_cart')}</h2>
          <p className="mt-1" style={{ fontSize: '0.875rem' }}>
            {t('items_from')} <strong style={{ color: 'var(--accent-primary)' }}>{restaurantName}</strong>
          </p>
        </div>
        <button onClick={clearCart} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
          🗑 {t('clear_cart')}
        </button>
      </div>

      {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

      <div className="cart-grid">
        <div className="card" style={{ padding: 0 }}>
          {items.map((item) => (
            <div key={item.dish.id} className="cart-item">
              <div className="cart-item-img">
                {item.dish.imageUrl ? (
                  <img
                    src={item.dish.imageUrl.startsWith('http') ? item.dish.imageUrl : `http://localhost:5082/${item.dish.imageUrl}`}
                    alt={getDishName(item.dish)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
                  />
                ) : '🍽'}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{getDishName(item.dish)}</div>
                <div className="cart-item-price">₴{item.dish.price}</div>
              </div>
              <div className="quantity-control">
                <button className="quantity-btn" onClick={() => updateQuantity(item.dish.id, item.quantity - 1)}>−</button>
                <span style={{ fontWeight: 600, minWidth: '1.5rem', textAlign: 'center' }}>{item.quantity}</span>
                <button className="quantity-btn" onClick={() => updateQuantity(item.dish.id, item.quantity + 1)}>+</button>
              </div>
              <div style={{ fontWeight: 700, minWidth: '5rem', textAlign: 'right', color: 'var(--text-primary)' }}>
                ₴{(item.dish.price * item.quantity).toFixed(2)}
              </div>
              <button
                onClick={() => removeItem(item.dish.id)}
                className="btn btn-ghost btn-icon btn-sm"
                style={{ color: 'var(--error)' }}
                title={t('remove')}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="card cart-summary-sticky">
          <h3 className="mb-4">{t('order_summary')}</h3>

          <div className="input-group">
            <label className="input-label">⏰ {t('pickup_time')} *</label>
            <input
              type="time"
              className="input-field"
              value={visitTime}
              min={getMinTime()}
              onChange={(e) => setVisitTime(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">💬 {t('comment')}</label>
            <textarea
              className="input-field"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder={t('comment')}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
            <div className="flex justify-between mb-2" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <span>{items.reduce((s, i) => s + i.quantity, 0)} {t('order_items').toLowerCase()}</span>
              <span>₴{totalPrice().toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span style={{ fontWeight: 600, fontSize: '1.0625rem' }}>{t('subtotal')}</span>
              <span style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--accent-primary)' }}>₴{totalPrice().toFixed(2)}</span>
            </div>
            <button
              onClick={handlePlaceOrder}
              className="btn btn-primary btn-lg w-full"
              disabled={isOrdering}
              id="place-order-btn"
            >
              {isOrdering
                ? <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: 2 }} />
                : `🛍 ${t('place_order')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
