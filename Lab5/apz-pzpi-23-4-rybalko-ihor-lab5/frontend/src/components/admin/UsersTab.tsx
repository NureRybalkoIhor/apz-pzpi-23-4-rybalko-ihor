import React from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../types';

interface UsersTabProps {
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterRole: string;
  setFilterRole: (val: string) => void;
  filteredUsers: User[];
  editingRole: { userId: number; role: string } | null;
  setEditingRole: (val: { userId: number; role: string } | null) => void;
  handleChangeRole: (userId: number, role: string) => void;
  toggleBlock: (userId: number, isBlocked: boolean) => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  isLoading,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  filteredUsers,
  editingRole,
  setEditingRole,
  handleChangeRole,
  toggleBlock,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="mb-6">{t('users_management')}</h2>
      <div className="card mb-4">
        <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ marginBottom: 0, flex: '1 1 240px' }}>
            <label className="input-label">{t('search')}</label>
            <input
              type="text"
              className="input-field"
              placeholder={`${t('search')}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0, flex: '0 1 180px' }}>
            <label className="input-label">{t('role')}</label>
            <select
              className="input-field"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">{t('all')}</option>
              <option value="Admin">Admin</option>
              <option value="RestaurantOwner">RestaurantOwner</option>
              <option value="KitchenStaff">KitchenStaff</option>
              <option value="Customer">Customer</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {isLoading ? (
          <div className="loading-overlay"><div className="spinner" /></div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>{t('email')}</th>
                  <th>{t('role')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                    <td>
                      {editingRole?.userId === user.id ? (
                        <select
                          className="input-field"
                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.8125rem' }}
                          value={editingRole.role}
                          onChange={(e) => setEditingRole({ ...editingRole, role: e.target.value })}
                          onBlur={() => handleChangeRole(user.id, editingRole.role)}
                          autoFocus
                        >
                          <option value="Admin">Admin</option>
                          <option value="RestaurantOwner">RestaurantOwner</option>
                          <option value="KitchenStaff">KitchenStaff</option>
                          <option value="Customer">Customer</option>
                        </select>
                      ) : (
                        <span
                          className="badge badge-primary"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setEditingRole({ userId: user.id, role: user.role })}
                          title={t('change_role')}
                        >
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.isBlocked ? 'badge-error' : 'badge-success'}`}>
                        {user.isBlocked ? t('blocked') : t('active')}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleBlock(user.id, !!user.isBlocked)}
                        className={`btn btn-sm ${user.isBlocked ? 'btn-success' : 'btn-danger'}`}
                      >
                        {user.isBlocked ? t('unblock') : t('block')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
