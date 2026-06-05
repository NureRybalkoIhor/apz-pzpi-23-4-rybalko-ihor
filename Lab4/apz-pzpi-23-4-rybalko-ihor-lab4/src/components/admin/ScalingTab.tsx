import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../../store/settingsStore';
import {
  generateDockerCompose,
  generateKubernetes,
  generateLocustFile,
} from '../../utils/configGenerators';
import type { ScalingParams } from '../../utils/configGenerators';

export const ScalingTab: React.FC = () => {
  const { t } = useTranslation();
  const { language } = useSettingsStore();

  // State for scaling configuration
  const [backendReplicas, setBackendReplicas] = useState(3);
  const [cpuLimit, setCpuLimit] = useState(1.0);
  const [memoryLimit, setMemoryLimit] = useState(512);
  const [hpaEnabled, setHpaEnabled] = useState(false);
  const [hpaMinReplicas, setHpaMinReplicas] = useState(2);
  const [hpaMaxReplicas, setHpaMaxReplicas] = useState(10);
  const [hpaTargetCpu, setHpaTargetCpu] = useState(70);
  const [dbConnectionPool, setDbConnectionPool] = useState(100);
  const [dbReplicas] = useState(1);
  const [dbStorage, setDbStorage] = useState(20);
  const [concurrentUsers, setConcurrentUsers] = useState(100);
  const [spawnRate, setSpawnRate] = useState(10);
  const [testDuration, setTestDuration] = useState(120);
  const [loadProfile, setLoadProfile] = useState<'constant' | 'ramp-up' | 'spike'>('constant');
  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([
    '/api/restaurants',
    '/api/dishes',
  ]);
  const [activeConfigTab, setActiveConfigTab] = useState<'docker' | 'k8s' | 'locust'>('docker');
  const [copySuccess, setCopySuccess] = useState(false);
  const [saveFolder, setSaveFolder] = useState<FileSystemDirectoryHandle | null>(null);

  const scalingParams: ScalingParams = {
    backendReplicas,
    cpuLimit,
    memoryLimit,
    hpaEnabled,
    hpaMinReplicas,
    hpaMaxReplicas,
    hpaTargetCpu,
    dbConnectionPool,
    dbReplicas,
    dbStorage,
    concurrentUsers,
    spawnRate,
    testDuration,
    loadProfile,
    endpoints: selectedEndpoints,
  };

  const configFiles = {
    docker: { name: 'docker-compose.yaml', content: generateDockerCompose(scalingParams) },
    k8s: { name: 'kubernetes.yaml', content: generateKubernetes(scalingParams) },
    locust: { name: 'locustfile.py', content: generateLocustFile(scalingParams) },
  };

  const handleSelectFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setSaveFolder(handle);
    } catch {
      // user cancelled
    }
  };

  const handleDownload = async (filename: string, content: string) => {
    if (saveFolder) {
      try {
        const fileHandle = await saveFolder.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return;
      } catch {
        // fallback to regular download
      }
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const toggleEndpoint = (ep: string) => {
    if (selectedEndpoints.includes(ep)) {
      if (selectedEndpoints.length > 1) {
        setSelectedEndpoints(selectedEndpoints.filter((e) => e !== ep));
      }
    } else {
      setSelectedEndpoints([...selectedEndpoints, ep]);
    }
  };

  return (
    <>
      <h2 className="mb-6">{t('scaling_config')}</h2>

      <div className="grid grid-2" style={{ gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column - Inputs & Sliders */}
        <div className="flex flex-col gap-5" style={{ minWidth: 0 }}>
          {/* Section 1: Backend Deployment */}
          <div className="card">
            <h3 className="mb-4" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              💻 {language === 'uk' ? 'Налаштування серверів бекенду' : 'Backend Server Infrastructure'}
            </h3>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('backend_replicas')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                  {backendReplicas}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="15"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={backendReplicas}
                onChange={(e) => setBackendReplicas(Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('cpu_limit')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                  {cpuLimit.toFixed(1)} Cores
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.1"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={cpuLimit}
                onChange={(e) => setCpuLimit(Number(e.target.value))}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('memory_limit')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                  {memoryLimit} MB
                </span>
              </div>
              <input
                type="range"
                min="128"
                max="8192"
                step="128"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={memoryLimit}
                onChange={(e) => setMemoryLimit(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Section 2: Autoscaling (HPA) */}
          <div className="card">
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0 }}>📈 {t('autoscaling_enabled')}</h3>
              <label className="switch-container" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hpaEnabled}
                  onChange={(e) => setHpaEnabled(e.target.checked)}
                  style={{ width: '1.5rem', height: '1.5rem', accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                />
              </label>
            </div>

            {hpaEnabled && (
              <div className="flex flex-col gap-4">
                <div className="input-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="input-label" style={{ marginBottom: 0 }}>{t('min_replicas')}</label>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{hpaMinReplicas}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    className="input-field"
                    style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                    value={hpaMinReplicas}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setHpaMinReplicas(val);
                      if (hpaMaxReplicas < val) setHpaMaxReplicas(val);
                    }}
                  />
                </div>

                <div className="input-group">
                  <div className="flex justify-between items-center mb-1">
                    <label className="input-label" style={{ marginBottom: 0 }}>{t('max_replicas')}</label>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{hpaMaxReplicas}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="30"
                    className="input-field"
                    style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                    value={hpaMaxReplicas}
                    onChange={(e) => setHpaMaxReplicas(Math.max(hpaMinReplicas, Number(e.target.value)))}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="input-label" style={{ marginBottom: 0 }}>{t('target_cpu')}</label>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{hpaTargetCpu}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="90"
                    step="5"
                    className="input-field"
                    style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                    value={hpaTargetCpu}
                    onChange={(e) => setHpaTargetCpu(Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Database Settings */}
          <div className="card">
            <h3 className="mb-4" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              🗄️ {language === 'uk' ? 'Налаштування бази даних (SQL Server)' : 'Database Config (SQL Server)'}
            </h3>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('connection_pool')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{dbConnectionPool}</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={dbConnectionPool}
                onChange={(e) => setDbConnectionPool(Number(e.target.value))}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('db_storage')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{dbStorage} GB</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                step="5"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={dbStorage}
                onChange={(e) => setDbStorage(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Section 4: Load Testing Simulation */}
          <div className="card">
            <h3 className="mb-4" style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              ⚡ {language === 'uk' ? 'Параметри симуляції навантаження' : 'Load Simulation Parameters'}
            </h3>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('concurrent_users')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{concurrentUsers} VUs</span>
              </div>
              <input
                type="range"
                min="10"
                max="3000"
                step="10"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={concurrentUsers}
                onChange={(e) => setConcurrentUsers(Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('spawn_rate')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>{spawnRate} VUs/s</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={spawnRate}
                onChange={(e) => setSpawnRate(Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <div className="flex justify-between items-center mb-1">
                <label className="input-label" style={{ marginBottom: 0 }}>{t('test_duration')}</label>
                <span style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.875rem' }}>
                  {testDuration}s ({Math.floor(testDuration / 60)}m {testDuration % 60}s)
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="1800"
                step="30"
                className="input-field"
                style={{ padding: 0, height: '6px', accentColor: 'var(--accent-primary)' }}
                value={testDuration}
                onChange={(e) => setTestDuration(Number(e.target.value))}
              />
            </div>

            <div className="input-group">
              <label className="input-label">{t('load_profile')}</label>
              <select
                className="input-field"
                value={loadProfile}
                onChange={(e) => setLoadProfile(e.target.value as any)}
              >
                <option value="constant">Constant Load (Постійне навантаження)</option>
                <option value="ramp-up">Ramp-Up / Ramp-Down (Планове зростання)</option>
                <option value="spike">Spike Load (Різкий стрибок)</option>
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">{t('target_endpoints')}</label>
              <div className="flex flex-col gap-2 mt-2">
                {[
                  '/api/auth/login',
                  '/api/restaurants',
                  '/api/dishes',
                  '/api/orders',
                  '/api/admin/users',
                ].map((ep) => (
                  <label key={ep} className="flex items-center gap-2" style={{ cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedEndpoints.includes(ep)}
                      onChange={() => toggleEndpoint(ep)}
                      style={{ accentColor: 'var(--accent-primary)', width: '1rem', height: '1rem' }}
                    />
                    <code>{ep}</code>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - File Previews */}
        <div className="card" style={{ padding: '1.25rem', position: 'sticky', top: '1.5rem', minWidth: 0, width: '100%' }}>
          {/* Header with Title and Actions */}
          <div className="flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', margin: 0 }}>
              📄 {language === 'uk' ? 'Генерація конфігурацій' : 'Config Generator'}
            </h3>

            <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
              <button
                onClick={handleSelectFolder}
                className="btn btn-sm btn-secondary"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                title={saveFolder ? `Folder: ${saveFolder.name}` : 'Select output folder for auto-save'}
              >
                {saveFolder ? `📁 ${saveFolder.name}` : '📁 Set Folder'}
              </button>
              <button
                onClick={() => handleCopyToClipboard(configFiles[activeConfigTab].content)}
                className="btn btn-sm btn-secondary"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', minWidth: '80px' }}
              >
                {copySuccess ? 'Copied! ✓' : '📋 Copy'}
              </button>
              <button
                onClick={() => handleDownload(configFiles[activeConfigTab].name, configFiles[activeConfigTab].content)}
                className="btn btn-sm btn-primary"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
              >
                📥 {t('download')}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4" style={{ flexWrap: 'wrap' }}>
            {(['docker', 'k8s', 'locust'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveConfigTab(tab)}
                className={`btn btn-sm ${activeConfigTab === tab ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.75rem', padding: '0.375rem 0.625rem', borderRadius: '4px' }}
              >
                {configFiles[tab].name}
              </button>
            ))}
          </div>

          {/* Code Preview */}
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <pre style={{
              margin: 0,
              padding: '1rem',
              backgroundColor: '#18181b',
              color: '#e4e4e7',
              borderRadius: '8px',
              fontSize: '0.75rem',
              overflowX: 'auto',
              maxHeight: '480px',
              whiteSpace: 'pre',
              fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
              border: '1px solid #27272a',
              width: '100%',
              boxSizing: 'border-box',
            }}>
              {configFiles[activeConfigTab].content}
            </pre>
          </div>

          <div className="mt-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            💡 <strong>{language === 'uk' ? 'Підказка:' : 'Instructions:'}</strong><br />
            {activeConfigTab === 'docker' && (
              <span>
                {language === 'uk'
                  ? '1. Завантажте docker-compose.yaml у робочу папку. 2. Запустіть сервіси через: `docker-compose up -d --scale api=' + backendReplicas + '`'
                  : '1. Download docker-compose.yaml. 2. Start services locally with: `docker-compose up -d --scale api=' + backendReplicas + '`'}
              </span>
            )}
            {activeConfigTab === 'k8s' && (
              <span>
                {language === 'uk'
                  ? '1. Перевірте, що Kubernetes активовано в Docker Desktop. 2. Запустіть маніфест: `kubectl apply -f kubernetes.yaml`'
                  : '1. Ensure Kubernetes cluster is running in Docker Desktop. 2. Apply this manifest in the terminal: `kubectl apply -f kubernetes.yaml`'}
              </span>
            )}
            {activeConfigTab === 'locust' && (
              <span>
                {language === 'uk'
                  ? '1. Встановіть Locust: `pip install locust`. 2. Запустіть команду: `locust -f locustfile.py`. 3. Відкрийте інтерфейс у браузері: http://localhost:8089'
                  : '1. Install Locust: `pip install locust`. 2. Start testing with command: `locust -f locustfile.py`. 3. Open Locust web interface at http://localhost:8089'}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
