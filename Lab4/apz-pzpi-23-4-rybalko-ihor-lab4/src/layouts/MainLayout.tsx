import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';

export const MainLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useSettingsStore();
  const { isAuthenticated, user, logout } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'uk' ? 'en' : 'uk';
    i18n.changeLanguage(newLang);
    useSettingsStore.getState().setLanguage(newLang);
    document.documentElement.setAttribute('lang', newLang);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/business');
  const isAdmin = user?.role === 'Admin';
  const isBusiness = user?.role === 'RestaurantOwner' || user?.role === 'KitchenStaff';
  const isCustomer = user?.role === 'Customer';

  const AdminNav = () => (
    <nav className="navbar navbar-admin">
      <div className="navbar-inner">
        <Link to="/admin" className="navbar-brand">
          <div className="navbar-brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            ⚙️
          </div>
          {t('app_title')} <span className="admin-badge">{t('admin_panel')}</span>
        </Link>

        <div className="navbar-links">
          <Link to="/admin" className={`navbar-link ${isActive('/admin') ? 'active' : ''}`}>
            📊 {t('system_overview')}
          </Link>
          <Link to="/admin/users" className={`navbar-link ${isActive('/admin/users') ? 'active' : ''}`}>
            👥 {t('users_management')}
          </Link>
          <Link to="/admin/restaurants" className={`navbar-link ${isActive('/admin/restaurants') ? 'active' : ''}`}>
            🍽 {t('restaurants')}
          </Link>
          <Link to="/admin/data" className={`navbar-link ${isActive('/admin/data') ? 'active' : ''}`}>
            💾 {t('data_management')}
          </Link>
        </div>

        <div className="navbar-actions">
          <button onClick={toggleLanguage} className="btn btn-ghost btn-icon" title={t('language')}>
            {i18n.language === 'uk' ? '🇺🇦' : '🇬🇧'}
          </button>
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title={t('theme')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', cursor: 'default' }} title={user?.email}>
            {(user?.fullName || user?.email || 'A')[0].toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}>
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );

  const BusinessNav = () => (
    <nav className="navbar navbar-business">
      <div className="navbar-inner">
        <Link to="/business" className="navbar-brand">
          <div className="navbar-brand-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            🏪
          </div>
          {t('app_title')} <span className="business-badge">{t('business_panel')}</span>
        </Link>

        <div className="navbar-links">
          <Link to="/business" className={`navbar-link ${isActive('/business') ? 'active' : ''}`}>
            🏪 {t('restaurant_info')}
          </Link>
        </div>

        <div className="navbar-actions">
          <button onClick={toggleLanguage} className="btn btn-ghost btn-icon" title={t('language')}>
            {i18n.language === 'uk' ? '🇺🇦' : '🇬🇧'}
          </button>
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title={t('theme')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', cursor: 'default' }} title={user?.email}>
            {(user?.fullName || user?.email || 'B')[0].toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}>
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );

  const PublicNav = () => (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-brand-icon">🍽</div>
          {t('app_title')}
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>{t('home')}</Link>
          <Link to="/restaurants" className={`navbar-link ${location.pathname.startsWith('/restaurants') ? 'active' : ''}`}>{t('restaurants')}</Link>
          {isAuthenticated && isCustomer && (
            <Link to="/orders" className={`navbar-link ${isActive('/orders') ? 'active' : ''}`}>{t('my_orders')}</Link>
          )}
        </div>

        <div className="navbar-actions">
          {isAuthenticated && isCustomer && (
            <Link to="/cart" className="btn btn-ghost btn-icon" style={{ position: 'relative' }} id="cart-btn">
              🛒
              {totalItems() > 0 && (
                <span className="cart-badge">{totalItems()}</span>
              )}
            </Link>
          )}

          <button onClick={toggleLanguage} className="btn btn-ghost btn-icon" title={t('language')} id="lang-toggle">
            {i18n.language === 'uk' ? '🇺🇦' : '🇬🇧'}
          </button>
          <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title={t('theme')} id="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link to="/admin" className="btn btn-sm btn-secondary">{t('admin_panel')}</Link>
              )}
              {isBusiness && (
                <Link to="/business" className="btn btn-sm btn-secondary">{t('business_panel')}</Link>
              )}
              {isCustomer && (
                <Link to="/profile" className="btn btn-ghost btn-icon">
                  <div className="avatar avatar-sm">{(user.fullName || user.email || 'U')[0].toUpperCase()}</div>
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-sm btn-ghost" style={{ color: 'var(--error)' }}>
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login" className="btn btn-sm btn-secondary" id="login-btn">{t('login')}</Link>
              <Link to="/register" className="btn btn-sm btn-primary" id="register-btn">{t('register')}</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );

  const renderNav = () => {
    if (isAdmin) return <AdminNav />;
    if (isBusiness) return <BusinessNav />;
    return <PublicNav />;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {renderNav()}

      {isDashboard ? (
        <Outlet />
      ) : (
        <>
          <main style={{ flex: 1 }}><Outlet /></main>
          <footer className="footer">
            <p>&copy; {new Date().getFullYear()} {t('app_title')}. {t('all_rights')}</p>
          </footer>
        </>
      )}
    </div>
  );
};
