import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RestaurantService } from '../services/api';
import { useSettingsStore } from '../store/settingsStore';
import type { Restaurant } from '../types';

export const Restaurants: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await RestaurantService.getAll();
        setRestaurants(res.data);
      } catch {
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getName = (r: Restaurant) => language === 'uk' ? (r.nameUA || r.nameEN || '') : (r.nameEN || r.nameUA || '');

  const filtered = restaurants.filter((r) =>
    getName(r).toLowerCase().includes(search.toLowerCase()) ||
    (r.address || '').toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div className="loading-overlay"><div className="spinner" /><p>{t('loading')}</p></div>;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>{t('restaurants')}</h2>
          <p className="mt-1" style={{ fontSize: '0.9375rem' }}>{filtered.length} {t('restaurants').toLowerCase()}</p>
        </div>
        <input type="text" className="input-field" placeholder={t('search_restaurants')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 320, width: '100%' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽</div>
          <p>{t('no_restaurants')}</p>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filtered.map((restaurant) => (
            <Link to={`/restaurants/${restaurant.id}`} key={restaurant.id} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="food-card card-interactive">
                <div className="food-card-img" style={{ height: 160, background: `linear-gradient(135deg, hsl(${restaurant.id * 47 % 360}, 60%, 85%) 0%, hsl(${(restaurant.id * 47 + 40) % 360}, 70%, 75%) 100%)` }}>
                  {restaurant.imageUrl ? (
                    <img src={restaurant.imageUrl.startsWith('http') ? restaurant.imageUrl : `http://localhost:5082/${restaurant.imageUrl}`} alt={getName(restaurant)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '3rem' }}>🍽</span>
                  )}
                </div>
                <div className="food-card-body">
                  <h3 className="food-card-title">{getName(restaurant)}</h3>
                  {restaurant.address && (
                    <p className="food-card-desc">📍 {restaurant.address}</p>
                  )}
                  <div style={{ marginTop: '0.75rem' }}>
                    <span className="btn btn-sm btn-primary">{t('view_menu')}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
