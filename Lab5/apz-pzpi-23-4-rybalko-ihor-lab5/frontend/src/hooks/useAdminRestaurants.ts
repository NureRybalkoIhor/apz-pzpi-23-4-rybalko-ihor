import { useState } from 'react';
import { RestaurantService, CategoryService, DishService, AdminService } from '../services/api';
import type { Restaurant, Category, Dish } from '../types';

export const useAdminRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restsLoading, setRestsLoading] = useState(false);
  const [selRestaurantId, setSelRestaurantId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [showAddDish, setShowAddDish] = useState(false);
  const [dishForm, setDishForm] = useState<{
    nameUA: string;
    nameEN: string;
    price: number;
    categoryId: number | '';
  }>({
    nameUA: '',
    nameEN: '',
    price: 0,
    categoryId: '',
  });

  const fetchRestaurants = async () => {
    setRestsLoading(true);
    try {
      const res = await RestaurantService.getAll();
      setRestaurants(res.data);
      if (res.data.length > 0) {
        const firstId = res.data[0].id;
        setSelRestaurantId(firstId);
        await loadRestaurantMenu(firstId);
      }
    } catch (err) {
      console.error('Failed to fetch restaurants:', err);
      setRestaurants([]);
    } finally {
      setRestsLoading(false);
    }
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
    } catch (err) {
      console.error('Failed to load menu:', err);
      setCategories([]);
      setDishes([]);
    }
  };

  const handleSelectRestaurant = async (id: number) => {
    setSelRestaurantId(id);
    await loadRestaurantMenu(id);
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
          return {
            ...r,
            categories: cats.map((c: Category) => ({
              ...c,
              dishes: dishes.filter((d: Dish) => d.categoryId === c.id),
            })),
          };
        })
      );
      const backup = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        restaurants: snapshot,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `restaurants_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export restaurants:', err);
    }
  };

  const handleToggleRestaurantStatus = async (id: number, isActive: boolean) => {
    try {
      await AdminService.toggleRestaurantStatus(id, !isActive);
      setRestaurants(
        restaurants.map((r) => (r.id === id ? { ...r, isActive: !isActive } : r))
      );
    } catch (err) {
      console.error('Failed to toggle restaurant status:', err);
    }
  };

  const handleDeleteDish = async (id: number) => {
    if (!confirm('Delete this dish?')) return;
    try {
      await DishService.delete(id);
      setDishes(dishes.filter((d) => d.id !== id));
    } catch (err) {
      console.error('Failed to delete dish:', err);
    }
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
    } catch (err) {
      console.error('Failed to add dish:', err);
    }
  };

  const selRestaurant = restaurants.find((r) => r.id === selRestaurantId) || null;

  return {
    restaurants,
    restsLoading,
    selRestaurantId,
    categories,
    dishes,
    showAddDish,
    setShowAddDish,
    dishForm,
    setDishForm,
    fetchRestaurants,
    loadRestaurantMenu,
    handleSelectRestaurant,
    handleExportRestaurants,
    handleToggleRestaurantStatus,
    handleDeleteDish,
    handleAddDish,
    selRestaurant,
  };
};
