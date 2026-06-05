import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/api';

export const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await AuthService.register({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex justify-center items-center" style={{ minHeight: 'calc(100vh - 180px)', padding: '2rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440 }}>
        <div className="text-center mb-6">
          <h2>{t('create_account')}</h2>
          <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('register_subtitle')}</p>
        </div>

        {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">{t('first_name')}</label>
            <input type="text" className="input-field" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">{t('email')}</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">{t('phone')}</label>
            <input type="tel" className="input-field" placeholder="+380..." value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="input-label">{t('password')}</label>
            <input type="password" className="input-field" value={form.password} onChange={(e) => update('password', e.target.value)} required minLength={6} />
          </div>
          <div className="input-group">
            <label className="input-label">{t('confirm_password')}</label>
            <input type="password" className="input-field" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full mt-4" disabled={isLoading}>
            {isLoading ? <span className="spinner" style={{ width: '1.25rem', height: '1.25rem', borderWidth: 2 }} /> : t('register')}
          </button>
        </form>

        <p className="text-center mt-6" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {t('have_account')}{' '}<Link to="/login" style={{ fontWeight: 600 }}>{t('login')}</Link>
        </p>
      </div>
    </div>
  );
};
