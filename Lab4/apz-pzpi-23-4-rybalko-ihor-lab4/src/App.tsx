import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Restaurants } from './pages/Restaurants';
import { RestaurantMenu } from './pages/RestaurantMenu';
import { Cart } from './pages/Cart';
import { Orders } from './pages/Orders';
import { Profile } from './pages/Profile';
import { AdminDashboard } from './pages/AdminDashboard';
import { BusinessDashboard } from './pages/BusinessDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="restaurants" element={<Restaurants />} />
        <Route path="restaurants/:id" element={<RestaurantMenu />} />

        {/* Customer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Customer']} />}>
          <Route path="cart" element={<Cart />} />
          <Route path="orders" element={<Orders />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Admin Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
          <Route path="admin" element={<AdminDashboard />} />
        </Route>

        {/* Business Dashboard */}
        <Route element={<ProtectedRoute allowedRoles={['RestaurantOwner', 'KitchenStaff']} />}>
          <Route path="business" element={<BusinessDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
