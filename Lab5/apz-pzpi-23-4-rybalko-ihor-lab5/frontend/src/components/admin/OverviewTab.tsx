import React from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../types';

interface OverviewTabProps {
  users: User[];
  stats: {
    total: number;
    active: number;
    blocked: number;
  };
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ users, stats }) => {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="mb-6">{t('system_overview')}</h2>
      <div className="grid grid-3 mb-6">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('total_users')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✓</div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">{t('active_users')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-bg)', color: 'var(--error)' }}>🚫</div>
          <div className="stat-content">
            <div className="stat-value">{stats.blocked}</div>
            <div className="stat-label">{t('blocked_users')}</div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="mb-4">{t('users_management')}</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>{t('email')}</th>
                <th>{t('role')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 5).map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar avatar-sm">{(user.fullName || user.email)[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.fullName}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{user.role}</span></td>
                  <td>
                    <span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>
                      {user.isBlocked ? t('blocked') : t('active')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
