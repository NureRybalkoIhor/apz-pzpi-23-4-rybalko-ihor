import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';
import type { Restaurant, Category, Dish } from '../../types';

interface RestaurantsTabProps {
  restaurants: Restaurant[];
  restsLoading: boolean;
  selRestaurantId: number | null;
  categories: Category[];
  dishes: Dish[];
  showAddDish: boolean;
  setShowAddDish: (val: boolean) => void;
  dishForm: {
    nameUA: string;
    nameEN: string;
    price: number;
    categoryId: number | '';
  };
  setDishForm: (val: any) => void;
  handleSelectRestaurant: (id: number) => void;
  handleExportRestaurants: () => void;
  handleToggleRestaurantStatus: (id: number, isActive: boolean) => void;
  handleDeleteDish: (id: number) => void;
  handleAddDish: () => void;
  selRestaurant: Restaurant | null;
}

export const RestaurantsTab: React.FC<RestaurantsTabProps> = ({
  restaurants,
  restsLoading,
  selRestaurantId,
  categories,
  dishes,
  showAddDish,
  setShowAddDish,
  dishForm,
  setDishForm,
  handleSelectRestaurant,
  handleExportRestaurants,
  handleToggleRestaurantStatus,
  handleDeleteDish,
  handleAddDish,
  selRestaurant,
}) => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();

  const getName = (item: { nameUA?: string; nameEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk'
      ? item.nameUA || item.nameEN || ''
      : item.nameEN || item.nameUA || '';
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2>{t('restaurants')}</h2>
        <div className="flex items-center gap-3">
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {restaurants.length} {t('restaurants').toLowerCase()}
          </span>
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
            {restaurants.map((r) => (
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleRestaurantStatus(r.id, !!r.isActive);
                      }}
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
                        <input
                          className="input-field"
                          value={dishForm.nameUA}
                          onChange={(e) => setDishForm({ ...dishForm, nameUA: e.target.value })}
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">{t('dish_name')} (EN)</label>
                        <input
                          className="input-field"
                          value={dishForm.nameEN}
                          onChange={(e) => setDishForm({ ...dishForm, nameEN: e.target.value })}
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">{t('price')} (₴) *</label>
                        <input
                          type="number"
                          className="input-field"
                          value={dishForm.price}
                          onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })}
                        />
                      </div>
                      <div className="input-group" style={{ marginBottom: 0 }}>
                        <label className="input-label">{t('add_category')} *</label>
                        <select
                          className="input-field"
                          value={dishForm.categoryId}
                          onChange={(e) => setDishForm({ ...dishForm, categoryId: Number(e.target.value) })}
                        >
                          <option value="">—</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {getName(c)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3">
                      <button onClick={handleAddDish} className="btn btn-primary btn-sm">
                        {t('save')}
                      </button>
                      <button onClick={() => setShowAddDish(false)} className="btn btn-ghost btn-sm">
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {categories.map((cat) => {
                const catDishes = dishes.filter((d) => d.categoryId === cat.id);
                return (
                  <div key={cat.id} className="card mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4>{getName(cat)}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {catDishes.length} {t('total_dishes').toLowerCase()}
                      </span>
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
                            {catDishes.map((dish) => (
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
  );
};
