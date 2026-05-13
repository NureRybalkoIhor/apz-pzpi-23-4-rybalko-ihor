import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem', maxWidth: 600 }}>
      <h2 className="mb-6">{t('my_profile')}</h2>

      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="avatar avatar-lg">{user.fullName?.[0] || user.email[0].toUpperCase()}</div>
          <div>
            <h3>{user.fullName}</h3>
            <p style={{ fontSize: '0.875rem' }}>{user.email}</p>
            <span className="badge badge-primary mt-1">{t(`roles.${user.role}`)}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1rem', fontSize: '0.9375rem' }}>
          <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('email')}</span>
            <span style={{ fontWeight: 500 }}>{user.email}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('first_name')}</span>
            <span style={{ fontWeight: 500 }}>{user.fullName || '—'}</span>
          </div>
          <div className="flex justify-between" style={{ padding: '0.75rem 0' }}>
            <span style={{ color: 'var(--text-muted)' }}>{t('role')}</span>
            <span style={{ fontWeight: 500 }}>{t(`roles.${user.role}`)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
