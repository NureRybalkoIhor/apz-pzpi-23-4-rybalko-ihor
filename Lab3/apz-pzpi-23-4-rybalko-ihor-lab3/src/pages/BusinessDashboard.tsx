import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RestaurantService, CategoryService, DishService, OrderService } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import { uk, enUS } from 'date-fns/locale';
import type { Restaurant, Category, Dish, Order } from '../types';

type BizTab = 'info' | 'menu' | 'orders' | 'stats';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Toast { id: number; type: 'success' | 'error'; message: string; }

export const BusinessDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<BizTab>('info');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const [newCatUA, setNewCatUA] = useState('');
  const [newCatEN, setNewCatEN] = useState('');
  const [showDishModal, setShowDishModal] = useState(false);
  const [dishFormError, setDishFormError] = useState<{ nameUA?: string; categoryId?: string }>({});
  const [dishForm, setDishForm] = useState<{
    nameUA: string; nameEN: string; descriptionUA: string; descriptionEN: string;
    price: number; preparationTimeMinutes: number; categoryId: number | '';
    image: File | null;
  }>({ nameUA: '', nameEN: '', descriptionUA: '', descriptionEN: '', price: 0, preparationTimeMinutes: 15, categoryId: '', image: null });


  const [showNewRestForm, setShowNewRestForm] = useState(false);
  const [newRestForm, setNewRestForm] = useState({ nameUA: '', nameEN: '', address: '', latitude: 50.45, longitude: 30.52 });

  const getName = (item: { nameUA?: string; nameEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk' ? (item.nameUA || item.nameEN || '') : (item.nameEN || item.nameUA || '');
  };

  const getDesc = (item: { descriptionUA?: string; descriptionEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk' ? (item.descriptionUA || item.descriptionEN || '') : (item.descriptionEN || item.descriptionUA || '');
  };

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId) || null;

  useEffect(() => {
    const loadData = async () => {
      try {
        const resR = await RestaurantService.getAll();
        setRestaurants(resR.data);
        if (resR.data.length > 0) {
          setSelectedRestaurantId(resR.data[0].id);
        }
      } catch {
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedRestaurantId) return;
    const loadRestData = async () => {
      try {
        const [resC, resO] = await Promise.all([
          CategoryService.getByRestaurant(selectedRestaurantId),
          OrderService.getAll(),
        ]);
        setCategories(resC.data);
        setOrders(resO.data.filter((o: Order) => o.restaurantId === selectedRestaurantId));

        const catIds = new Set(resC.data.map((c: Category) => c.id));
        const resD = await DishService.getAll();
        setDishes(resD.data.filter((d: Dish) => catIds.has(d.categoryId)));
      } catch {
        setCategories([]);
        setDishes([]);
        setOrders([]);
      }
    };
    loadRestData();
  }, [selectedRestaurantId]);

  const formatDate = (dateStr: string) => {
    try {
      const locale = language === 'uk' ? uk : enUS;
      return format(new Date(dateStr), 'dd MMM yyyy, HH:mm', { locale });
    } catch {
      return dateStr;
    }
  };


  const handleCreateRestaurant = async () => {
    if (!newRestForm.nameUA.trim()) return;
    try {
      const res = await RestaurantService.create(newRestForm);
      setRestaurants([...restaurants, res.data]);
      setSelectedRestaurantId(res.data.id);
      setShowNewRestForm(false);
      setNewRestForm({ nameUA: '', nameEN: '', address: '', latitude: 50.45, longitude: 30.52 });
    } catch { }
  };

  const handleAddCategory = async () => {
    if (!newCatUA.trim() || !selectedRestaurantId) {
      showToast('error', 'Category name (UA) is required');
      return;
    }
    try {
      const res = await CategoryService.create({ nameUA: newCatUA, nameEN: newCatEN || newCatUA, restaurantId: selectedRestaurantId });
      setCategories([...categories, res.data]);
      setNewCatUA('');
      setNewCatEN('');
      showToast('success', t('category_added') || `Category "${newCatUA}" added`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await CategoryService.delete(id);
      setCategories(categories.filter((c) => c.id !== id));
      setDishes(dishes.filter((d) => d.categoryId !== id));
    } catch { }
  };

  const handleAddDish = async () => {
    const errors: { nameUA?: string; categoryId?: string } = {};
    if (!dishForm.nameUA.trim()) errors.nameUA = t('field_required') || 'Required';
    if (!dishForm.categoryId) errors.categoryId = t('select_category') || 'Select a category';
    if (Object.keys(errors).length > 0) {
      setDishFormError(errors);
      return;
    }
    setDishFormError({});
    const formData = new FormData();
    formData.append('NameUA', dishForm.nameUA);
    formData.append('NameEN', dishForm.nameEN || dishForm.nameUA);
    formData.append('DescriptionUA', dishForm.descriptionUA);
    formData.append('DescriptionEN', dishForm.descriptionEN);
    formData.append('Price', String(dishForm.price));
    formData.append('PreparationTimeMinutes', String(dishForm.preparationTimeMinutes));
    formData.append('CategoryId', String(dishForm.categoryId));
    formData.append('IsAvailable', 'true');
    if (dishForm.image) {
      formData.append('Image', dishForm.image);
    }
    try {
      const res = await DishService.create(formData);
      setDishes([...dishes, res.data]);
      setShowDishModal(false);
      setDishFormError({});
      setDishForm({ nameUA: '', nameEN: '', descriptionUA: '', descriptionEN: '', price: 0, preparationTimeMinutes: 15, categoryId: '', image: null });
      showToast('success', t('dish_added') || `Dish "${dishForm.nameUA}" added`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to create dish');
    }
  };

  const handleDeleteDish = async (id: number) => {
    try {
      await DishService.delete(id);
      setDishes(dishes.filter((d) => d.id !== id));
    } catch { }
  };

  const handleToggleDish = (id: number) => {
    setDishes(dishes.map((d) => d.id === id ? { ...d, isAvailable: !d.isAvailable } : d));
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      await OrderService.updateStatus(orderId, status);
      setOrders(orders.map((o) => o.id === orderId ? { ...o, status } : o));
      showToast('success', `Order #${orderId} → ${status}`);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update status');
    }
  };

  const isOwner = user?.role === 'RestaurantOwner';

  const sidebarItems: { key: BizTab; icon: string; label: string }[] = [
    { key: 'info', icon: '🏪', label: t('restaurant_info') },
    { key: 'menu', icon: '📋', label: t('menu_management') },
    { key: 'orders', icon: '📦', label: t('orders_management') },
    { key: 'stats', icon: '📊', label: t('analytics') },
  ];

  const totalSales = orders.reduce((s, o) => s + o.totalAmount, 0);
  const avgOrder = orders.length > 0 ? Math.round(totalSales / orders.length) : 0;

  const ordersByHour: Record<string, { sales: number; orders: number }> = {};
  orders.forEach((o) => {
    try {
      const h = format(new Date(o.createdAt), 'HH:00');
      if (!ordersByHour[h]) ordersByHour[h] = { sales: 0, orders: 0 };
      ordersByHour[h].sales += o.totalAmount;
      ordersByHour[h].orders += 1;
    } catch { }
  });
  const salesData = Object.entries(ordersByHour)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, val]) => ({ name, ...val }));

  const categoryStats = categories.map((cat) => {
    const catDishes = dishes.filter((d) => d.categoryId === cat.id);
    const catDishIds = new Set(catDishes.map((d) => d.id));
    const catOrderItems = orders.flatMap((o) => o.items.filter((item) => catDishIds.has(item.dishId)));
    const total = catOrderItems.reduce((s, item) => s + item.price * item.quantity, 0);
    return { name: getName(cat), value: total };
  }).filter((c) => c.value > 0);

  if (isLoading) return <div className="loading-overlay"><div className="spinner" /><p>{t('loading')}</p></div>;

  return (
    <div className="dashboard-layout">
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
          </div>
        ))}
      </div>
      <aside className="sidebar">
        <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1rem' }}>
            🏪 {selectedRestaurant ? getName(selectedRestaurant) : t('business_panel')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--sidebar-text)', opacity: 0.7, marginTop: '0.25rem' }}>
            {isOwner ? t('roles.RestaurantOwner') : t('roles.KitchenStaff')}
          </p>
          {restaurants.length > 1 && (
            <select
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.375rem', borderRadius: '6px', fontSize: '0.8125rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              value={selectedRestaurantId || ''}
              onChange={(e) => setSelectedRestaurantId(Number(e.target.value))}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id} style={{ color: '#000' }}>{getName(r)}</option>
              ))}
            </select>
          )}
        </div>
        <nav className="sidebar-section">
          <div className="sidebar-label">{t('settings')}</div>
          {sidebarItems.map((item) => (
            <div key={item.key} className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="dashboard-content">


        {activeTab === 'info' && (
          <>
            <h2 className="mb-6">{t('restaurant_info')}</h2>

            {selectedRestaurant ? (
              <div className="card" style={{ maxWidth: 600 }}>
                <div className="flex items-center gap-4 mb-4">
                  {selectedRestaurant.imageUrl ? (
                    <img src={selectedRestaurant.imageUrl.startsWith('http') ? selectedRestaurant.imageUrl : `http://localhost:5082/${selectedRestaurant.imageUrl}`} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ fontSize: '3rem' }}>🏪</div>
                  )}
                  <div>
                    <h3>{getName(selectedRestaurant)}</h3>
                    {selectedRestaurant.address && <p className="mt-1" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>📍 {selectedRestaurant.address}</p>}
                    <span className={`badge mt-1 ${selectedRestaurant.isActive ? 'badge-success' : 'badge-error'}`}>
                      {selectedRestaurant.isActive ? t('active') : t('blocked')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9375rem' }}>
                  <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('restaurant_name')} (UA)</span>
                    <span style={{ fontWeight: 500 }}>{selectedRestaurant.nameUA}</span>
                  </div>
                  <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('restaurant_name')} (EN)</span>
                    <span style={{ fontWeight: 500 }}>{selectedRestaurant.nameEN}</span>
                  </div>
                  <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('restaurant_address')}</span>
                    <span style={{ fontWeight: 500 }}>{selectedRestaurant.address || '—'}</span>
                  </div>
                  <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Latitude / Longitude</span>
                    <span style={{ fontWeight: 500 }}>{selectedRestaurant.latitude}, {selectedRestaurant.longitude}</span>
                  </div>
                  {selectedRestaurant.owner && (
                    <div className="flex justify-between" style={{ padding: '0.75rem 0' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{t('owner')}</span>
                      <span style={{ fontWeight: 500 }}>{selectedRestaurant.owner.fullName} ({selectedRestaurant.owner.email})</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🏪</div>
                <h3>{t('no_restaurants')}</h3>
              </div>
            )}

            {isOwner && (
              <div className="mt-6">
                {!showNewRestForm ? (
                  <button onClick={() => setShowNewRestForm(true)} className="btn btn-primary">+ {t('add_restaurant')}</button>
                ) : (
                  <div className="card" style={{ maxWidth: 600 }}>
                    <h3 className="mb-4">{t('add_restaurant')}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">{t('restaurant_name')} (UA) *</label>
                        <input className="input-field" value={newRestForm.nameUA} onChange={(e) => setNewRestForm({ ...newRestForm, nameUA: e.target.value })} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">{t('restaurant_name')} (EN)</label>
                        <input className="input-field" value={newRestForm.nameEN} onChange={(e) => setNewRestForm({ ...newRestForm, nameEN: e.target.value })} />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('restaurant_address')}</label>
                      <input className="input-field" value={newRestForm.address} onChange={(e) => setNewRestForm({ ...newRestForm, address: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="input-group">
                        <label className="input-label">Latitude</label>
                        <input type="number" step="0.0001" className="input-field" value={newRestForm.latitude} onChange={(e) => setNewRestForm({ ...newRestForm, latitude: Number(e.target.value) })} />
                      </div>
                      <div className="input-group">
                        <label className="input-label">Longitude</label>
                        <input type="number" step="0.0001" className="input-field" value={newRestForm.longitude} onChange={(e) => setNewRestForm({ ...newRestForm, longitude: Number(e.target.value) })} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={handleCreateRestaurant} className="btn btn-primary">{t('save')}</button>
                      <button onClick={() => setShowNewRestForm(false)} className="btn btn-secondary">{t('cancel')}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'menu' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2>{t('menu_management')}</h2>
              <button onClick={() => setShowDishModal(true)} className="btn btn-primary">+ {t('add_dish')}</button>
            </div>

            <div className="card mb-6">
              <h3 className="mb-4">{t('add_category')}</h3>
              <div className="flex gap-3 items-end" style={{ flexWrap: 'wrap' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
                  <label className="input-label">{t('category_name')} (UA)</label>
                  <input className="input-field" placeholder="Піца" value={newCatUA} onChange={(e) => setNewCatUA(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: '1 1 180px' }}>
                  <label className="input-label">{t('category_name')} (EN)</label>
                  <input className="input-field" placeholder="Pizza" value={newCatEN} onChange={(e) => setNewCatEN(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                </div>
                <button onClick={handleAddCategory} className="btn btn-primary">{t('add_category')}</button>
              </div>
              <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                {categories.map((cat) => (
                  <span key={cat.id} className="badge badge-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem', gap: '0.5rem' }}>
                    {getName(cat)}
                    {isOwner && (
                      <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, fontSize: '0.875rem', padding: 0, lineHeight: 1 }}>x</button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {categories.map((cat) => {
              const catDishes = dishes.filter((d) => d.categoryId === cat.id);
              if (catDishes.length === 0) return null;
              return (
                <div key={cat.id} className="mb-6">
                  <h3 className="mb-3">{getName(cat)}</h3>
                  <div className="grid grid-auto">
                    {catDishes.map((dish) => (
                      <div key={dish.id} className="food-card">
                        <div className="food-card-img">
                          {dish.imageUrl ? (
                            <img src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `http://localhost:5082/${dish.imageUrl}`} alt={getName(dish)} />
                          ) : (
                            <span>🍽</span>
                          )}
                        </div>
                        <div className="food-card-body">
                          <div className="flex items-center justify-between">
                            <div className="food-card-title">{getName(dish)}</div>
                            <span className={`badge ${dish.isAvailable ? 'badge-success' : 'badge-error'}`} style={{ cursor: 'pointer' }} onClick={() => handleToggleDish(dish.id)}>
                              {dish.isAvailable ? t('available') : t('unavailable')}
                            </span>
                          </div>
                          <p className="food-card-desc">{getDesc(dish)}</p>
                          <div className="food-card-footer mt-3">
                            <span className="food-card-price">{'₴'}{dish.price}</span>
                            {dish.preparationTimeMinutes && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🕐 {dish.preparationTimeMinutes} {t('minutes')}</span>
                            )}
                            {isOwner && (
                              <button onClick={() => handleDeleteDish(dish.id)} className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}>✕</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {showDishModal && (
              <div className="modal-overlay" onClick={() => setShowDishModal(false)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3 className="modal-title">{t('add_dish')}</h3>
                    <button className="modal-close" onClick={() => setShowDishModal(false)}>x</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">{t('dish_name')} (UA) *</label>
                      <input
                        className="input-field"
                        value={dishForm.nameUA}
                        onChange={(e) => { setDishForm({ ...dishForm, nameUA: e.target.value }); setDishFormError(p => ({ ...p, nameUA: undefined })); }}
                        style={dishFormError.nameUA ? { borderColor: 'var(--error)' } : {}}
                      />
                      {dishFormError.nameUA && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {dishFormError.nameUA}</span>}
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('dish_name')} (EN)</label>
                      <input className="input-field" value={dishForm.nameEN} onChange={(e) => setDishForm({ ...dishForm, nameEN: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">{t('description')} (UA)</label>
                      <textarea className="input-field" value={dishForm.descriptionUA} onChange={(e) => setDishForm({ ...dishForm, descriptionUA: e.target.value })} rows={2} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('description')} (EN)</label>
                      <textarea className="input-field" value={dishForm.descriptionEN} onChange={(e) => setDishForm({ ...dishForm, descriptionEN: e.target.value })} rows={2} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">{t('price')} ({'₴'}) *</label>
                      <input type="number" className="input-field" value={dishForm.price} onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('preparation_time')}</label>
                      <input type="number" className="input-field" placeholder="15" value={dishForm.preparationTimeMinutes} onChange={(e) => setDishForm({ ...dishForm, preparationTimeMinutes: Number(e.target.value) })} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">{t('add_category')} *</label>
                      <select
                        className="input-field"
                        value={dishForm.categoryId}
                        onChange={(e) => { setDishForm({ ...dishForm, categoryId: Number(e.target.value) }); setDishFormError(p => ({ ...p, categoryId: undefined })); }}
                        style={dishFormError.categoryId ? { borderColor: 'var(--error)' } : {}}
                      >
                        <option value="">— {t('select_category') || 'Select category'} —</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{getName(c)}</option>)}
                      </select>
                      {dishFormError.categoryId && <span style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {dishFormError.categoryId}</span>}
                      {categories.length === 0 && <span style={{ color: 'var(--warning)', fontSize: '0.75rem', marginTop: '0.25rem' }}>⚠ {t('no_categories') || 'No categories yet — add one first'}</span>}
                    </div>
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('upload_image')}</label>
                    <input type="file" accept="image/*" className="input-field" onChange={(e) => setDishForm({ ...dishForm, image: e.target.files?.[0] || null })} />
                  </div>
                  <div className="modal-footer">
                    <button onClick={() => setShowDishModal(false)} className="btn btn-secondary">{t('cancel')}</button>
                    <button onClick={handleAddDish} className="btn btn-primary">{t('save')}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            <h2 className="mb-6">{t('orders_management')}</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <h3>{t('no_orders')}</h3>
              </div>
            ) : (
              <div className="card" style={{ padding: 0 }}>
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t('order_items')}</th>
                        <th>{t('order_total')}</th>
                        <th>{t('pickup_time')}</th>
                        <th>{t('order_date')}</th>
                        <th>{t('status')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>#{order.id}</td>
                          <td>
                            {order.items.map((item, i) => (
                              <span key={i}>{item.dishName} x{item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                            ))}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{'₴'}{order.totalAmount}</td>
                          <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            {order.visitTime ? formatDate(order.visitTime) : '—'}
                          </td>
                          <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</td>
                          <td>
                            <span className={`badge ${order.status === 'Completed' ? 'badge-success' :
                              order.status === 'Cancelled' ? 'badge-error' :
                                order.status === 'Cooking' ? 'badge-primary' :
                                  order.status === 'Ready' ? 'badge-success' :
                                    order.status === 'Paid' ? 'badge-info' :
                                      'badge-warning'
                              }`}>
                              {t(order.status.toLowerCase())}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                              {order.status === 'Pending' && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Cooking')} className="btn btn-sm btn-primary">{t('cooking')}</button>
                              )}
                              {order.status === 'Paid' && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Cooking')} className="btn btn-sm btn-primary">{t('cooking')}</button>
                              )}
                              {order.status === 'Cooking' && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Ready')} className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }}>{t('ready')}</button>
                              )}
                              {order.status === 'Ready' && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Completed')} className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff' }}>{t('completed')}</button>
                              )}
                              {(order.status === 'Pending' || order.status === 'Paid' || order.status === 'Cooking') && (
                                <button onClick={() => handleUpdateOrderStatus(order.id, 'Cancelled')} className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}>{t('cancel')}</button>
                              )}
                              {(order.status === 'Completed' || order.status === 'Cancelled') && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'stats' && (
          <>
            <h2 className="mb-6">{t('analytics')}</h2>

            <div className="grid grid-4 mb-6">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>💰</div>
                <div className="stat-content">
                  <div className="stat-value">{'₴'}{totalSales}</div>
                  <div className="stat-label">{t('total_sales')}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>📦</div>
                <div className="stat-content">
                  <div className="stat-value">{orders.length}</div>
                  <div className="stat-label">{t('total_orders')}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>📊</div>
                <div className="stat-content">
                  <div className="stat-value">{'₴'}{avgOrder}</div>
                  <div className="stat-label">{t('avg_order_value')}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>🍽</div>
                <div className="stat-content">
                  <div className="stat-value">{dishes.length}</div>
                  <div className="stat-label">{t('total_dishes')}</div>
                </div>
              </div>
            </div>

            {salesData.length > 0 ? (
              <div className="grid grid-2 mb-6">
                <div className="card">
                  <h3 className="mb-4">{t('sales_stats')}</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="sales" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="card">
                  <h3 className="mb-4">{t('peak_hours')}</h3>
                  <div style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                        <Bar dataKey="orders" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card mb-6">
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p>{t('no_orders')}</p>
                </div>
              </div>
            )}

            {categoryStats.length > 0 && (
              <div className="card" style={{ maxWidth: 400 }}>
                <h3 className="mb-4">{t('category_split')}</h3>
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryStats} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                        {categoryStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 justify-center mt-2" style={{ flexWrap: 'wrap' }}>
                  {categoryStats.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1" style={{ fontSize: '0.8125rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'inline-block' }} />
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
