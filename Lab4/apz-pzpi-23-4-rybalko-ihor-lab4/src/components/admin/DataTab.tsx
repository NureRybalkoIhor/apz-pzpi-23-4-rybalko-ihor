import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportResult } from '../../hooks/useAdminUsers';

interface DataTabProps {
  isImporting: boolean;
  importResults: ImportResult[] | null;
  setImportResults: (val: ImportResult[] | null) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const DataTab: React.FC<DataTabProps> = ({
  isImporting,
  importResults,
  setImportResults,
  handleExport,
  handleImport,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <h2 className="mb-6">{t('data_management')}</h2>

      <div className="grid grid-2 mb-6">
        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📤</div>
          <h3>{t('export_data')}</h3>
          <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('backup_desc')}</p>
          <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Saves all users with their current roles and block status as a <code>.json</code> file.
          </p>
          <button onClick={handleExport} className="btn btn-primary mt-4" id="export-btn">
            📤 {t('export_data')}
          </button>
        </div>

        <div className="card">
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📥</div>
          <h3>{t('import_data')}</h3>
          <p className="mt-2" style={{ fontSize: '0.9375rem' }}>{t('backup_desc')}</p>
          <p className="mt-2" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Reads the backup file and applies any role or block status changes to the live database via API.
          </p>
          <label
            className={`btn mt-4 ${isImporting ? 'btn-ghost' : 'btn-secondary'}`}
            style={{ cursor: isImporting ? 'not-allowed' : 'pointer' }}
            id="import-btn"
          >
            {isImporting ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: 2 }} /> Applying...
              </>
            ) : (
              <>📥 {t('import_data')}</>
            )}
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {importResults && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3>Import Report</h3>
            <div className="flex gap-3" style={{ fontSize: '0.8125rem' }}>
              <span style={{ color: 'var(--success)' }}>
                ✓ {importResults.filter((r) => r.status === 'ok').length} applied
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                — {importResults.filter((r) => r.status === 'skipped').length} skipped
              </span>
              <span style={{ color: 'var(--error)' }}>
                ✕ {importResults.filter((r) => r.status === 'error').length} errors
              </span>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Result</th>
                  <th>Changes</th>
                </tr>
              </thead>
              <tbody>
                {importResults.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          r.status === 'ok'
                            ? 'badge-success'
                            : r.status === 'error'
                            ? 'badge-error'
                            : 'badge-warning'
                        }`}
                      >
                        {r.status === 'ok'
                          ? '✓ Applied'
                          : r.status === 'error'
                          ? '✕ Error'
                          : '— Skipped'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{r.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={() => setImportResults(null)} className="btn btn-ghost btn-sm mt-4">
            {t('close')}
          </button>
        </div>
      )}
    </>
  );
};
