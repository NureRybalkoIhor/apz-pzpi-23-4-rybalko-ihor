import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useAdminRestaurants } from '../hooks/useAdminRestaurants';

import { OverviewTab } from '../components/admin/OverviewTab';
import { UsersTab } from '../components/admin/UsersTab';
import { RestaurantsTab } from '../components/admin/RestaurantsTab';
import { DataTab } from '../components/admin/DataTab';
import { ScalingTab } from '../components/admin/ScalingTab';

type AdminTab = 'overview' | 'users' | 'restaurants' | 'data' | 'scaling';

export const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Hooks for encapsulation
  const adminUsers = useAdminUsers();
  const adminRests = useAdminRestaurants();

  const sidebarItems: { key: AdminTab; icon: string; label: string }[] = [
    { key: 'overview', icon: '📊', label: t('system_overview') },
    { key: 'users', icon: '👥', label: t('users_management') },
    { key: 'restaurants', icon: '🍽', label: t('restaurants') },
    { key: 'data', icon: '💾', label: t('data_management') },
    { key: 'scaling', icon: '⚡', label: t('scaling_config') },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ color: '#fff', fontSize: '1rem' }}>⚙️ {t('admin_panel')}</h3>
        </div>
        <nav className="sidebar-section">
          <div className="sidebar-label">{t('settings')}</div>
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-link ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>
      </aside>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <OverviewTab
            users={adminUsers.users}
            stats={adminUsers.stats}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            isLoading={adminUsers.isLoading}
            searchQuery={adminUsers.searchQuery}
            setSearchQuery={adminUsers.setSearchQuery}
            filterRole={adminUsers.filterRole}
            setFilterRole={adminUsers.setFilterRole}
            filteredUsers={adminUsers.filteredUsers}
            editingRole={adminUsers.editingRole}
            setEditingRole={adminUsers.setEditingRole}
            handleChangeRole={adminUsers.handleChangeRole}
            toggleBlock={adminUsers.toggleBlock}
          />
        )}

        {activeTab === 'restaurants' && (
          <RestaurantsTab
            restaurants={adminRests.restaurants}
            restsLoading={adminRests.restsLoading}
            selRestaurantId={adminRests.selRestaurantId}
            categories={adminRests.categories}
            dishes={adminRests.dishes}
            showAddDish={adminRests.showAddDish}
            setShowAddDish={adminRests.setShowAddDish}
            dishForm={adminRests.dishForm}
            setDishForm={adminRests.setDishForm}
            handleSelectRestaurant={adminRests.handleSelectRestaurant}
            handleExportRestaurants={adminRests.handleExportRestaurants}
            handleToggleRestaurantStatus={adminRests.handleToggleRestaurantStatus}
            handleDeleteDish={adminRests.handleDeleteDish}
            handleAddDish={adminRests.handleAddDish}
            selRestaurant={adminRests.selRestaurant}
          />
        )}

        {activeTab === 'data' && (
          <DataTab
            isImporting={adminUsers.isImporting}
            importResults={adminUsers.importResults}
            setImportResults={adminUsers.setImportResults}
            handleExport={adminUsers.handleExport}
            handleImport={adminUsers.handleImport}
          />
        )}

        {activeTab === 'scaling' && (
          <ScalingTab />
        )}
      </div>
    </div>
  );
};
export default AdminDashboard;
