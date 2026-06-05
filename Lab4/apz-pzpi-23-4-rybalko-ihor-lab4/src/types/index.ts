export type Role = 'Admin' | 'RestaurantOwner' | 'KitchenStaff' | 'Customer';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isBlocked?: boolean;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
}

export interface OwnerDto {
  id: number;
  fullName: string;
  email: string;
}

export interface Restaurant {
  id: number;
  nameUA: string;
  nameEN: string;
  address?: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  paidUntil?: string;
  ownerId: number;
  owner?: OwnerDto;
}

export interface Category {
  id: number;
  nameUA: string;
  nameEN: string;
  restaurantId: number;
}

export interface Dish {
  id: number;
  nameUA: string;
  nameEN: string;
  descriptionUA?: string;
  descriptionEN?: string;
  price: number;
  imageUrl?: string;
  preparationTimeMinutes?: number;
  isAvailable: boolean;
  categoryId: number;
  categoryNameUA?: string;
}

export interface CartItem {
  dish: Dish;
  quantity: number;
}

export interface OrderItem {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: number;
  userId: number;
  userName?: string;
  restaurantId: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
  visitTime: string;
  comment?: string;
  estimatedReadyTime?: string;
}

export type OrderStatus = 'Pending' | 'Paid' | 'Cooking' | 'Ready' | 'Completed' | 'Cancelled';
