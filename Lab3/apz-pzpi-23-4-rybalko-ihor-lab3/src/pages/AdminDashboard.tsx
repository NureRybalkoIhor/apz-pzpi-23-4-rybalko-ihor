import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminService, RestaurantService, CategoryService, DishService } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import type { User, Restaurant, Category, Dish } from '../types';

type AdminTab = 'overview' | 'users' | 'restaurants' | 'data';

interface ImportResult {
  email: string;
  status: 'ok' | 'error' | 'skipped';
  change: string;
}

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingRole, setEditingRole] = useState<{ userId: number; role: string } | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selRestaurantId, setSelRestaurantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [restsLoading, setRestsLoading] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishForm, setDishForm] = useState({ nameUA: '', nameEN: '', price: 0, categoryId: '' as number | '' });

  const getName = (item: { nameUA?: string; nameEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk' ? (item.nameUA || item.nameEN || '') : (item.nameEN || item.nameUA || '');
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (activeTab === 'restaurants' && restaurants.length === 0) fetchRestaurants();
  }, [activeTab]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getUsers();
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setRestsLoading(true);
    try {
      const res = await RestaurantService.getAll();
      setRestaurants(res.data);
      if (res.data.length > 0) {
        const firstId = res.data[0].id;
        setSelRestaurantId(firstId);
        loadRestaurantMenu(firstId);
      }
    } catch { setRestaurants([]); }
    finally { setRestsLoading(false); }
  };

  const loadRestaurantMenu = async (restaurantId: number) => {
    try {
      const [resC, resD] = await Promise.all([
        CategoryService.getByRestaurant(restaurantId),
        DishService.getAll(),
      ]);
      setCategories(resC.data);
      const catIds = new Set(resC.data.map((c: Category) => c.id));
      setDishes(resD.data.filter((d: Dish) => catIds.has(d.categoryId)));
    } catch { setCategories([]); setDishes([]); }
  };

  const handleSelectRestaurant = (id: number) => {
    setSelRestaurantId(id);
    loadRestaurantMenu(id);
    setShowAddDish(false);
  };

  const handleExportRestaurants = async () => {
    try {
      const snapshot = await Promise.all(
        restaurants.map(async (r) => {
          const resC = await CategoryService.getByRestaurant(r.id);
          const cats = resC.data;
          const allDishes = await DishService.getAll();
          const catIds = new Set(cats.map((c: Category) => c.id));
          const dishes = allDishes.data.filter((d: Dish) => catIds.has(d.categoryId));
          return { ...r, categories: cats.map((c: Category) => ({ ...c, dishes: dishes.filter((d: Dish) => d.categoryId === c.id) })) };
        })
      );
      const backup = { version: '1.0', exportedAt: new Date().toISOString(), restaurants: snapshot };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurants_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
  };

  const handleToggleRestaurantStatus = async (id: number, isActive: boolean) => {
    try {
      await AdminService.toggleRestaurantStatus(id, !isActive);
      setRestaurants(restaurants.map(r => r.id === id ? { ...r, isActive: !isActive } : r));
    } catch { }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Delete this dish?')) return;
    try {
      await DishService.delete(id);
      setDishes(dishes.filter(d => d.id !== id));
    } catch { }
  };

  const handleAddDish = async () => {
    if (!dishForm.nameUA.trim() || !dishForm.categoryId || !selRestaurantId) return;
    const fd = new FormData();
    fd.append('NameUA', dishForm.nameUA);
    fd.append('NameEN', dishForm.nameEN || dishForm.nameUA);
    fd.append('Price', String(dishForm.price));
    fd.append('CategoryId', String(dishForm.categoryId));
    fd.append('IsAvailable', 'true');
    try {
      const res = await DishService.create(fd);
      setDishes([...dishes, res.data]);
      setDishForm({ nameUA: '', nameEN: '', price: 0, categoryId: '' });
      setShowAddDish(false);
    } catch { }
  };

  const toggleBlock = async (userId: number, isBlocked: boolean) => {
    try {
      if (isBlocked) await AdminService.unblockUser(userId);
      else await AdminService.blockUser(userId, 'Admin decision');
      fetchUsers();
    } catch { }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await AdminService.changeRole(userId, newRole);
      fetchUsers();
    } catch { }
    setEditingRole(null);
  };

  const handleExport = () => {
    const backup = { users, exportedAt: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodpreorder_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.users || !Array.isArray(data.users)) {
          alert('Invalid backup file: missing "users" array');
          return;
        }

        setIsImporting(true);
        setImportResults(null);

        const importedUsers: User[] = data.users;
        const results: ImportResult[] = [];

        for (const imported of importedUsers) {
          const current = users.find((u) => u.id === imported.id);

          if (!current) {
            results.push({ email: imported.email, status: 'skipped', change: 'User not found in system' });
            continue;
          }

          const changes: string[] = [];

          try {
            if (imported.role && imported.role !== current.role) {
              await AdminService.changeRole(imported.id, imported.role);
              changes.push(`Role: ${current.role} → ${imported.role}`);
            }
            if (imported.isBlocked !== undefined && imported.isBlocked !== current.isBlocked) {
              if (imported.isBlocked) {
                await AdminService.blockUser(imported.id, 'Restored from backup');
                changes.push('Blocked');
              } else {
                await AdminService.unblockUser(imported.id);
                changes.push('Unblocked');
              }
            }

            if (changes.length === 0) {
              results.push({ email: imported.email, status: 'skipped', change: 'No changes needed' });
            } else {
              results.push({ email: imported.email, status: 'ok', change: changes.join('; ') });
            }
          } catch (err: any) {
            results.push({
              email: imported.email,
              status: 'error',
              change: err?.response?.data?.message || 'API error',
            });
          }
        }

        setImportResults(results);
        await fetchUsers();
      } catch {
        alert('Error parsing JSON file. Make sure it is a valid FoodPreOrder backup.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.isBlocked).length,
    blocked: users.filter((u) => u.isBlocked).length,
  };

  const sidebarItems: { key: AdminTab; icon: string; label: string }[] = [
    { key: 'overview', icon: '📊', label: t('system_overview') },
    { key: 'users', icon: '👥', label: t('users_management') },
    { key: 'restaurants', icon: '🍽', label: t('restaurants') },
    { key: 'data', icon: '💾', label: t('data_management') },
  ];

  const selRestaurant = restaurants.find(r => r.id === selRestaurantId) || null;

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1rem' }}>⚙️ {t('admin_panel')}</h3>
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
        {activeTab === 'overview' && (
          <>
            <h2 className="mb-6">{t('system_overview')}</h2>
            <div className="grid grid-3 mb-6">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>👥</div>
                <div className="stat-content"><div className="stat-value">{stats.total}</div><div className="stat-label">{t('total_users')}</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✓</div>
                <div className="stat-content"><div className="stat-value">{stats.active}</div><div className="stat-label">{t('active_users')}</div></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>🚫</div>
                <div className="stat-content"><div className="stat-value">{stats.blocked}</div><div className="stat-label">{t('blocked_users')}</div></div>
              </div>
            </div>
            <div className="card">
              <h3 className="mb-4">{t('users_management')}</h3>
              <div className="table-container">
                <table>
                  <thead><tr><th>{t('email')}</th><th>{t('role')}</th><th>{t('status')}</th></tr></thead>
                  <tbody>
                    {users.slice(0, 5).map((user) => (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar avatar-sm">{(user.fullName || user.email)[0].toUpperCase()}</div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-primary">{user.role}</span></td>
                        <td><span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>{user.isBlocked ? t('blocked') : t('active')}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'restaurants' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2>{t('restaurants')}</h2>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{restaurants.length} {t('restaurants').toLowerCase()}</span>
                <button
                  onClick={handleExportRestaurants}
                  className="btn btn-secondary btn-sm"
                  disabled={restaurants.length === 0}
                  title={t('export_data')}
                >
                  📥 {t('export_data')}
                </button>
              </div>
            </div>

            {restsLoading ? (
              <div className="loading-overlay"><div className="spinner" /></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div className="card" style={{ padding: 0 }}>
                  {restaurants.map(r => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRestaurant(r.id)}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        background: selRestaurantId === r.id ? 'var(--accent-light)' : 'transparent',
                        transition: 'background var(--transition-fast)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: selRestaurantId === r.id ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                            {getName(r)}
                          </div>
                          {r.address && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>📍 {r.address}</div>}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className={`badge ${r.isActive ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.625rem' }}>
                            {r.isActive ? t('active') : t('blocked')}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleRestaurantStatus(r.id, !!r.isActive); }}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.6875rem', padding: '0.125rem 0.375rem', color: r.isActive ? 'var(--error)' : 'var(--success)' }}
                          >
                            {r.isActive ? t('block') : t('unblock')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {restaurants.length === 0 && (
                    <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏪</div>
                      <p style={{ fontSize: '0.875rem' }}>{t('no_restaurants')}</p>
                    </div>
                  )}
                </div>

                {selRestaurant && (
                  <div>
                    <div className="card mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3>🍽 {getName(selRestaurant)} — {t('menu_management')}</h3>
                        <button onClick={() => setShowAddDish(!showAddDish)} className="btn btn-primary btn-sm">
                          {showAddDish ? t('cancel') : `+ ${t('add_dish')}`}
                        </button>
                      </div>

                      {showAddDish && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">{t('dish_name')} (UA) *</label>
                              <input className="input-field" value={dishForm.nameUA} onChange={e => setDishForm({ ...dishForm, nameUA: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">{t('dish_name')} (EN)</label>
                              <input className="input-field" value={dishForm.nameEN} onChange={e => setDishForm({ ...dishForm, nameEN: e.target.value })} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">{t('price')} (₴) *</label>
                              <input type="number" className="input-field" value={dishForm.price} onChange={e => setDishForm({ ...dishForm, price: Number(e.target.value) })} />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label className="input-label">{t('add_category')} *</label>
                              <select className="input-field" value={dishForm.categoryId} onChange={e => setDishForm({ ...dishForm, categoryId: Number(e.target.value) })}>
                                <option value="">—</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{getName(c)}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="flex gap-3 mt-3">
                            <button onClick={handleAddDish} className="btn btn-primary btn-sm">{t('save')}</button>
                            <button onClick={() => setShowAddDish(false)} className="btn btn-ghost btn-sm">{t('cancel')}</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {categories.map(cat => {
                      const catDishes = dishes.filter(d => d.categoryId === cat.id);
                      return (
                        <div key={cat.id} className="card mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4>{getName(cat)}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{catDishes.length} {t('total_dishes').toLowerCase()}</span>
                          </div>
                          {catDishes.length === 0 ? (
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{t('no_dishes')}</p>
                          ) : (
                            <div className="table-container">
                              <table>
                                <thead>
                                  <tr>
                                    <th>{t('dish_name')}</th>
                                    <th>{t('price')}</th>
                                    <th>{t('status')}</th>
                                    <th>{t('actions')}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {catDishes.map(dish => (
                                    <tr key={dish.id}>
                                      <td style={{ fontWeight: 500 }}>
                                        {dish.imageUrl && (
                                          <img
                                            src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `http://localhost:5082/${dish.imageUrl}`}
                                            alt=""
                                            style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', marginRight: 8, verticalAlign: 'middle' }}
                                          />
                                        )}
                                        {getName(dish)}
                                      </td>
                                      <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₴{dish.price}</td>
                                      <td>
                                        <span className={`badge ${dish.isAvailable ? 'badge-success' : 'badge-error'}`}>
                                          {dish.isAvailable ? t('available') : t('unavailable')}
                                        </span>
                                      </td>
                                      <td>
                                        <button
                                          onClick={() => handleDeleteDish(dish.id)}
                                          className="btn btn-sm btn-ghost"
                                          style={{ color: 'var(--error)' }}
                                          title={t('delete')}
                                        >
                                          ✕ {t('delete')}
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {categories.length === 0 && (
                      <div className="card empty-state">
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                        <p>{t('no_categories')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'users' && (
          <>
            <h2 className="mb-6">{t('users_management')}</h2>
            <div className="card mb-4">
              <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ marginBottom: 0, flex: '1 1 240px' }}>
                  <label className="input-label">{t('search')}</label>
                  <input type="text" className="input-field" placeholder={`${t('search')}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="input-group" style={{ marginBottom: 0, flex: '0 1 180px' }}>
                  <label className="input-label">{t('role')}</label>
                  <select className="input-field" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="all">{t('all')}</option>
                    <option value="Admin">Admin</option>
                    <option value="RestaurantOwner">RestaurantOwner</option>
                    <option value="KitchenStaff">KitchenStaff</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: 0 }}>
              {isLoading ? (
                <div className="loading-overlay"><div className="spinner" /></div>
              ) : (
                <div className="table-container" style={{ border: 'none' }}>
                  <table>
                    <thead><tr><th>{t('email')}</th><th>{t('role')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar avatar-sm">{(user.fullName || user.email)[0].toUpperCase()}</div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            {editingRole?.userId === user.id ? (
                              <select className="input-field" style={{ padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }} value={editingRole.role} onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })} onBlur={() => handleChangeRole(user.id, editingRole.role)}>
                                <option value="Admin">Admin</option>
                                <option value="RestaurantOwner">RestaurantOwner</option>
                                <option value="KitchenStaff">KitchenStaff</option>
                                <option value="Customer">Customer</option>
                              </select>
                            ) : (
                              <span className="badge badge-primary" style={{ cursor: 'pointer' }} onClick={() => setEditingRole({ userId: user.id, role: user.role })} title={t('change_role')}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td><span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>{user.isBlocked ? t('blocked') : t('active')}</span></td>
                          <td>
                            <button onClick={() => toggleBlock(user.id, !!user.isBlocked)} className={`btn btn-sm ${user.isBlocked ? 'btn-success' : 'btn-danger'}`}>
                              {user.isBlocked ? t('unblock') : t('block')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'data' && (
          <>
            <h2 className="mb-6">{t('data_management')}</h2>

            <div className="grid grid-2 mb-6">
              <div className="card">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📤</div>
                <h3>{t('export_data')}</h3>
                <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('backup_desc')}</p>
                <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Saves all users with their current roles and block status as a <code>.json</code> file.
                </p>
                <button onClick={handleExport} className="btn btn-primary mt-4" id="export-btn">
                  📤 {t('export_data')}
                </button>
              </div>

              <div className="card">
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📥</div>
                <h3>{t('import_data')}</h3>
                <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('backup_desc')}</p>
                <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Reads the backup file and applies any role or block status changes to the live database via API.
                </p>
                <label
                  className={`btn mt-4 ${isImporting ? 'btn-ghost' : 'btn-secondary'}`}
                  style={{ cursor: isImporting ? 'not-allowed' : 'pointer' }}
                  id="import-btn"
                >
                  {isImporting
                    ? <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2 }} /> Applying...
                    </>
                    : <>📥 {t('import_data')}</>}
                  <input
                    type="file"
                    accept=".json"
                    style={{ display: 'none' }}
                    onChange={handleImport}
                    disabled={isImporting}
                  />
                </label>
              </div>
            </div>

            {importResults && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3>Import Report</h3>
                  <div className="flex gap-3" style={{ fontSize: '0.8125rem' }}>
                    <span style={{ color: 'var(--success)' }}>
                      ✓ {importResults.filter(r => r.status === 'ok').length} applied
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>
                      — {importResults.filter(r => r.status === 'skipped').length} skipped
                    </span>
                    <span style={{ color: 'var(--error)' }}>
                      ✕ {importResults.filter(r => r.status === 'error').length} errors
                    </span>
                  </div>
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Result</th>
                        <th>Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResults.map((r, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 500 }}>{r.email}</td>
                          <td>
                            <span className={`badge ${r.status === 'ok' ? 'badge-success' :
                              r.status === 'error' ? 'badge-error' :
                                'badge-warning'
                              }`}>
                              {r.status === 'ok' ? '✓ Applied' :
                                r.status === 'error' ? '✕ Error' :
                                  '— Skipped'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{r.change}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => setImportResults(null)}
                  className="btn btn-ghost btn-sm mt-4"
                >
                  {t('close')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
