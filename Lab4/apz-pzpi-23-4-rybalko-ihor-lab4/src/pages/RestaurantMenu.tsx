import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { RestaurantService, DishService, CategoryService } from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Restaurant, Dish, Category } from '../types';

export const RestaurantMenu: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { language } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [addedDish, setAddedDish] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const restaurantId = id ? parseInt(id) : 0;

  const getName = (item: { nameUA?: string; nameEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk' ? (item.nameUA || item.nameEN || '') : (item.nameEN || item.nameUA || '');
  };

  const getDesc = (item: { descriptionUA?: string; descriptionEN?: string } | null) => {
    if (!item) return '';
    return language === 'uk' ? (item.descriptionUA || item.descriptionEN || '') : (item.descriptionEN || item.descriptionUA || '');
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!restaurantId) return;
      try {
        const [resR, resC, resD] = await Promise.all([
          RestaurantService.getById(restaurantId),
          CategoryService.getByRestaurant(restaurantId),
          DishService.getAll(),
        ]);
        setRestaurant(resR.data);
        setCategories(resC.data);
        const catIds = new Set(resC.data.map((c: Category) => c.id));
        setDishes(resD.data.filter((d: Dish) => catIds.has(d.categoryId)));
      } catch {
        setRestaurant(null);
        setCategories([]);
        setDishes([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [restaurantId]);

  const handleAddToCart = (dish: Dish) => {
    if (!restaurant) return;
    addItem(dish, restaurant.id, getName(restaurant));
    setAddedDish(dish.id);
    setTimeout(() => setAddedDish(null), 1500);
  };

  const filteredDishes = activeCategory
    ? dishes.filter((d) => d.categoryId === activeCategory)
    : dishes;

  if (isLoading) {
    return <div className="loading-overlay"><div className="spinner" /><p>{t('loading')}</p></div>;
  }

  if (!restaurant) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="empty-state">
          <div className="empty-state-icon">🍽</div>
          <p>{t('no_restaurants')}</p>
          <Link to="/restaurants" className="btn btn-primary mt-4">{t('back_to_restaurants')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <Link to="/restaurants" style={{ fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        ← {t('back_to_restaurants')}
      </Link>

      <div className="card mb-6" style={{ background: `linear-gradient(135deg, hsl(${restaurant.id * 47 % 360}, 60%, 92%) 0%, hsl(${(restaurant.id * 47 + 40) % 360}, 70%, 88%) 100%)`, border: 'none' }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          {restaurant.imageUrl ? (
            <img src={restaurant.imageUrl.startsWith('http') ? restaurant.imageUrl : `http://localhost:5082/${restaurant.imageUrl}`} alt="" style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', objectFit: 'cover' }} />
          ) : (
            <div style={{ fontSize: '3rem' }}>🍽</div>
          )}
          <div>
            <h2>{getName(restaurant)}</h2>
            {restaurant.address && <p className="mt-1">📍 {restaurant.address}</p>}
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <div className="tabs">
          <button className={`tab ${activeCategory === null ? 'active' : ''}`} onClick={() => setActiveCategory(null)}>
            {t('all')}
          </button>
          {categories.map((cat) => (
            <button key={cat.id} className={`tab ${activeCategory === cat.id ? 'active' : ''}`} onClick={() => setActiveCategory(cat.id)}>
              {getName(cat)}
            </button>
          ))}
        </div>
      )}

      {filteredDishes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍽</div>
          <p>{t('no_dishes')}</p>
        </div>
      ) : (
        <div className="grid grid-auto">
          {filteredDishes.filter((d) => d.isAvailable).map((dish) => (
            <div key={dish.id} className="food-card">
              <div className="food-card-img">
                {dish.imageUrl ? (
                  <img src={dish.imageUrl.startsWith('http') ? dish.imageUrl : `http://localhost:5082/${dish.imageUrl}`} alt={getName(dish)} />
                ) : (
                  <span>🍽</span>
                )}
              </div>
              <div className="food-card-body">
                <div className="food-card-title">{getName(dish)}</div>
                <p className="food-card-desc">{getDesc(dish)}</p>
                <div className="food-card-footer mt-3">
                  <span className="food-card-price">₴{dish.price}</span>
                  {isAuthenticated ? (
                    <button onClick={() => handleAddToCart(dish)} className={`btn btn-sm ${addedDish === dish.id ? 'btn-success' : 'btn-primary'}`}>
                      {addedDish === dish.id ? '✓ ' + t('added_to_cart') : '+ ' + t('add_to_cart')}
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-sm btn-secondary">{t('login')}</Link>
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
