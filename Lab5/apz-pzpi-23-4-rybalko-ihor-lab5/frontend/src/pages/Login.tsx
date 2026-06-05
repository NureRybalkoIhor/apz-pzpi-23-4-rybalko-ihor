import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/api';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await AuthService.login({ email, password });
      const data = response.data;
      login(data.token, { email: data.email, fullName: data.fullName, role: data.role });

      if (data.role === 'Admin') navigate('/admin');
      else if (data.role === 'RestaurantOwner' || data.role === 'KitchenStaff') navigate('/business');
      else navigate('/restaurants');
    } catch {
      setError(t('login_failed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: 'calc(100vh - 180px)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <div className="text-center mb-6">
          <h2>{t('welcome_back')}</h2>
          <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('login_subtitle')}</p>
        </div>

        {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <input type="email" className="input-field" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">{t('password')}</label>
            <input type="password" className="input-field" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full mt-4" disabled={isLoading}>
            {isLoading ? <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: 2 }} /> : t('login')}
          </button>
        </form>

        <p className="text-center mt-6" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {t('no_account')}{' '}<Link to="/register" style={{ fontWeight: 600 }}>{t('register')}</Link>
        </p>
      </div>
    </div>
  );
};
