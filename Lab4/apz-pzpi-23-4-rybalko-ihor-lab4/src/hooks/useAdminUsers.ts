import { useState, useEffect } from 'react';
import { AdminService } from '../services/api';
import type { User } from '../types';

export interface ImportResult {
  email: string;
  status: 'ok' | 'error' | 'skipped';
  change: string;
}

export const useAdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingRole, setEditingRole] = useState<{ userId: number; role: string } | null>(null);
  const [importResults, setImportResults] = useState<ImportResult[] | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await AdminService.getUsers();
      setUsers(res.data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBlock = async (userId: number, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await AdminService.unblockUser(userId);
      } else {
        await AdminService.blockUser(userId, 'Admin decision');
      }
      await fetchUsers();
    } catch (err) {
      console.error('Failed to toggle block status:', err);
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await AdminService.changeRole(userId, newRole);
      await fetchUsers();
    } catch (err) {
      console.error('Failed to change user role:', err);
    }
    setEditingRole(null);
  };

  const handleExport = () => {
    const backup = { users, exportedAt: new Date().toISOString(), version: '1.0' };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `foodpreorder_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.users || !Array.isArray(data.users)) {
          alert('Invalid backup file: missing "users" array');
          return;
        }

        setIsImporting(true);
        setImportResults(null);

        const importedUsers: User[] = data.users;
        const results: ImportResult[] = [];

        for (const imported of importedUsers) {
          const current = users.find((u) => u.id === imported.id);

          if (!current) {
            results.push({ email: imported.email, status: 'skipped', change: 'User not found in system' });
            continue;
          }

          const changes: string[] = [];

          try {
            if (imported.role && imported.role !== current.role) {
              await AdminService.changeRole(imported.id, imported.role);
              changes.push(`Role: ${current.role} → ${imported.role}`);
            }
            if (imported.isBlocked !== undefined && imported.isBlocked !== current.isBlocked) {
              if (imported.isBlocked) {
                await AdminService.blockUser(imported.id, 'Restored from backup');
                changes.push('Blocked');
              } else {
                await AdminService.unblockUser(imported.id);
                changes.push('Unblocked');
              }
            }

            if (changes.length === 0) {
              results.push({ email: imported.email, status: 'skipped', change: 'No changes needed' });
            } else {
              results.push({ email: imported.email, status: 'ok', change: changes.join('; ') });
            }
          } catch (err: any) {
            results.push({
              email: imported.email,
              status: 'error',
              change: err?.response?.data?.message || 'API error',
            });
          }
        }

        setImportResults(results);
        await fetchUsers();
      } catch (err) {
        console.error('Import error:', err);
        alert('Error parsing JSON file. Make sure it is a valid FoodPreOrder backup.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.isBlocked).length,
    blocked: users.filter((u) => u.isBlocked).length,
  };

  return {
    users,
    isLoading,
    searchQuery,
    setSearchQuery,
    filterRole,
    setFilterRole,
    editingRole,
    setEditingRole,
    importResults,
    setImportResults,
    isImporting,
    fetchUsers,
    toggleBlock,
    handleChangeRole,
    handleExport,
    handleImport,
    filteredUsers,
    stats,
  };
};
